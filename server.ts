import 'dotenv/config';
import crypto from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMO_BLOG_POSTS, DEMO_CATEGORIES, DEMO_COUPONS, DEMO_PRODUCTS } from './src/data/seedData.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const PAYMENT_SIGNING_SECRET =
  process.env.PAYMENT_SIGNING_SECRET || crypto.randomBytes(32).toString('hex');

// Simple in-memory sliding-window rate limiter
const rateBuckets = new Map<string, number[]>();
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const hits = (rateBuckets.get(key) || []).filter((ts) => now - ts < windowMs);
    if (hits.length >= maxRequests) {
      return res.status(429).json({
        error: 'Zu viele Anfragen. Bitte versuchen Sie es in einer Minute erneut.',
      });
    }
    hits.push(now);
    rateBuckets.set(key, hits);
    next();
  };
}

// In-memory sandbox payment sessions (verified server-side before order confirmation)
interface SandboxPaymentSession {
  intentId: string;
  amountEur: number;
  method: string;
  provider: string;
  signature: string;
  status: 'pending' | 'verified' | 'refunded';
  createdAt: number;
}
const sandboxSessions = new Map<string, SandboxPaymentSession>();

function signSession(intentId: string, amountEur: number, method: string): string {
  return crypto
    .createHmac('sha256', PAYMENT_SIGNING_SECRET)
    .update(`${intentId}:${amountEur.toFixed(2)}:${method}`)
    .digest('hex');
}

function getBaseUrl(req: Request): string {
  if (process.env.APP_URL && !process.env.APP_URL.includes('MY_APP_URL')) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ delivered: boolean; mode: 'resend' | 'sandbox' }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'E-MOTION BIKES <service@emotion-bikes-demo.de>';
  if (!apiKey) {
    return { delivered: false, mode: 'sandbox' };
  }
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });
    return { delivered: resp.ok, mode: 'resend' };
  } catch {
    return { delivered: false, mode: 'sandbox' };
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Robots.txt for German SEO
  app.get('/robots.txt', (req, res) => {
    const baseUrl = getBaseUrl(req);
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /konto',
        'Disallow: /checkout',
        'Disallow: /warenkorb',
        'Disallow: /api/',
        `Sitemap: ${baseUrl}/sitemap.xml`,
      ].join('\n')
    );
  });

  // Dynamic XML Sitemap
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = getBaseUrl(req);
    const now = new Date().toISOString().split('T')[0];

    const staticRoutes = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/shop', priority: '0.9', changefreq: 'daily' },
      { loc: '/kaufberater', priority: '0.8', changefreq: 'weekly' },
      { loc: '/vergleich', priority: '0.7', changefreq: 'weekly' },
      { loc: '/ratgeber', priority: '0.8', changefreq: 'weekly' },
      { loc: '/ueber-uns', priority: '0.6', changefreq: 'monthly' },
      { loc: '/kontakt', priority: '0.7', changefreq: 'monthly' },
      { loc: '/impressum', priority: '0.3', changefreq: 'yearly' },
      { loc: '/datenschutz', priority: '0.3', changefreq: 'yearly' },
      { loc: '/agb', priority: '0.3', changefreq: 'yearly' },
      { loc: '/widerruf', priority: '0.3', changefreq: 'yearly' },
      { loc: '/versand', priority: '0.4', changefreq: 'monthly' },
    ];

    const categoryUrls = DEMO_CATEGORIES.map((c) => ({
      loc: `/kategorie/${c.slug}`,
      priority: '0.85',
      changefreq: 'weekly',
    }));

    const productUrls = DEMO_PRODUCTS.filter((p) => p.published).map((p) => ({
      loc: `/produkt/${p.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
    }));

    const blogUrls = DEMO_BLOG_POSTS.filter((b) => b.published).map((b) => ({
      loc: `/ratgeber/${b.slug}`,
      priority: '0.75',
      changefreq: 'monthly',
    }));

    const allUrls = [...staticRoutes, ...categoryUrls, ...productUrls, ...blogUrls];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
    res.type('application/xml').send(xml);
  });

  // Public runtime configuration (never returns secret keys)
  app.get('/api/public-config', (_req, res) => {
    res.json({
      mapsApiKey:
        process.env.VITE_GOOGLE_MAPS_API_KEY ||
        process.env.GOOGLE_MAPS_API_KEY ||
        '',
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      mollieConfigured: Boolean(process.env.MOLLIE_API_KEY),
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
    });
  });

  // Validate coupon server-side
  app.post('/api/coupons/validate', rateLimit(30, 60_000), (req, res) => {
    const code = String(req.body?.code || '').trim().toUpperCase();
    const subtotalEur = Number(req.body?.subtotalEur || 0);
    if (!code) {
      return res.status(400).json({ error: 'Bitte einen Gutscheincode eingeben.' });
    }
    const found = DEMO_COUPONS.find((c) => c.code === code && c.active);
    if (!found) {
      return res.status(404).json({ error: 'Gutscheincode ungültig oder abgelaufen.' });
    }
    if (subtotalEur < found.minPurchaseEur) {
      return res.status(400).json({
        error: `Mindestbestellwert von ${found.minPurchaseEur} € für diesen Code nicht erreicht.`,
      });
    }
    res.json({ coupon: found });
  });

  // Create server-side payment session (Stripe / Mollie / Sandbox)
  app.post('/api/payments/create-session', rateLimit(20, 60_000), async (req, res) => {
    const amountEur = Number(req.body?.amountEur || 0);
    const paymentMethod = String(req.body?.paymentMethod || 'card');
    const customerEmail = String(req.body?.customerEmail || '').trim();
    const orderNumber = String(req.body?.orderNumber || '');

    if (!Number.isFinite(amountEur) || amountEur <= 0 || amountEur > 100000) {
      return res.status(400).json({ error: 'Ungültiger Bestellbetrag.' });
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      return res.status(400).json({ error: 'Gültige E-Mail-Adresse erforderlich.' });
    }

    // Stripe live/test REST integration when STRIPE_SECRET_KEY is configured
    if (paymentMethod === 'card' && process.env.STRIPE_SECRET_KEY) {
      try {
        const body = new URLSearchParams({
          amount: String(Math.round(amountEur * 100)),
          currency: 'eur',
          'payment_method_types[]': 'card',
          receipt_email: customerEmail,
          'metadata[orderNumber]': orderNumber,
        });
        const stripeResp = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        });
        if (stripeResp.ok) {
          const data = (await stripeResp.json()) as { id: string; client_secret: string };
          return res.json({
            provider: 'Stripe',
            mode: 'stripe',
            intentId: data.id,
            clientSecret: data.client_secret,
            amountEur,
          });
        }
      } catch (err) {
        console.error('Stripe PaymentIntent error:', err);
      }
    }

    // Mollie integration when MOLLIE_API_KEY is configured
    if (
      ['klarna', 'paypal', 'sepa'].includes(paymentMethod) &&
      process.env.MOLLIE_API_KEY
    ) {
      try {
        const baseUrl = getBaseUrl(req);
        const mollieResp = await fetch('https://api.mollie.com/v2/payments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: { currency: 'EUR', value: amountEur.toFixed(2) },
            description: `E-MOTION BIKES Bestellung ${orderNumber}`,
            redirectUrl: `${baseUrl}/checkout?payment=mollie&order=${encodeURIComponent(orderNumber)}`,
            method: paymentMethod === 'sepa' ? 'directdebit' : paymentMethod,
          }),
        });
        if (mollieResp.ok) {
          const data = (await mollieResp.json()) as {
            id: string;
            _links?: { checkout?: { href?: string } };
          };
          return res.json({
            provider: 'Mollie',
            mode: 'mollie',
            intentId: data.id,
            checkoutUrl: data._links?.checkout?.href,
            amountEur,
          });
        }
      } catch (err) {
        console.error('Mollie payment error:', err);
      }
    }

    // Server-signed Sandbox Payment Provider Session (never stores raw card details)
    const intentId = `sbx_pi_${crypto.randomBytes(10).toString('hex')}`;
    const signature = signSession(intentId, amountEur, paymentMethod);
    const providerMap: Record<string, string> = {
      card: 'Stripe Sandbox',
      paypal: 'PayPal Sandbox',
      klarna: 'Klarna Sandbox',
      sepa: 'SEPA Sandbox',
      bank_transfer: 'Vorkasse / Überweisung',
    };
    const provider = providerMap[paymentMethod] || 'Sandbox Provider';

    sandboxSessions.set(intentId, {
      intentId,
      amountEur,
      method: paymentMethod,
      provider,
      signature,
      status: 'pending',
      createdAt: Date.now(),
    });

    res.json({
      provider,
      mode: 'sandbox',
      intentId,
      signature,
      amountEur,
    });
  });

  // Server-side payment verification before marking order paid
  app.post('/api/payments/verify', rateLimit(20, 60_000), async (req, res) => {
    const intentId = String(req.body?.intentId || '');
    const signature = String(req.body?.signature || '');
    const amountEur = Number(req.body?.amountEur || 0);
    const paymentMethod = String(req.body?.paymentMethod || 'card');
    const simulateFailure = Boolean(req.body?.simulateFailure);

    if (!intentId) {
      return res.status(400).json({ error: 'Payment Intent ID fehlt.' });
    }

    if (simulateFailure) {
      return res.status(402).json({
        verified: false,
        paymentStatus: 'failed',
        error: 'Zahlungsautorisierung vom Sandbox-Provider abgelehnt.',
      });
    }

    // Verify Stripe live/test PaymentIntent if prefix matches
    if (intentId.startsWith('pi_') && process.env.STRIPE_SECRET_KEY) {
      const resp = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(intentId)}`, {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      });
      if (!resp.ok) {
        return res.status(402).json({ verified: false, error: 'Stripe-Verifizierung fehlgeschlagen.' });
      }
      const data = (await resp.json()) as { status: string };
      const isPaid = data.status === 'succeeded';
      return res.json({
        verified: isPaid,
        paymentStatus: isPaid ? 'verified' : 'pending',
        orderStatus: isPaid ? 'paid' : 'pending',
        provider: 'Stripe',
      });
    }

    // Verify Sandbox session signature
    const session = sandboxSessions.get(intentId);
    if (!session) {
      return res.status(404).json({ verified: false, error: 'Zahlungssitzung nicht gefunden.' });
    }
    const expectedSig = signSession(intentId, session.amountEur, session.method);
    if (signature !== expectedSig || Math.abs(session.amountEur - amountEur) > 0.01) {
      return res.status(400).json({ verified: false, error: 'Ungültige Zahlungssignatur.' });
    }

    if (paymentMethod === 'bank_transfer') {
      session.status = 'pending';
      return res.json({
        verified: false,
        paymentStatus: 'pending',
        orderStatus: 'pending',
        provider: session.provider,
        message: 'Bestellung erfasst. Zahlungsstatus bleibt bis zum Geldeingang auf Ausstehend.',
      });
    }

    session.status = 'verified';
    return res.json({
      verified: true,
      paymentStatus: 'verified',
      orderStatus: 'paid',
      provider: session.provider,
      verifiedAt: new Date().toISOString(),
    });
  });

  // Admin refund processing endpoint
  app.post('/api/payments/refund', rateLimit(15, 60_000), async (req, res) => {
    const intentId = String(req.body?.intentId || '');
    const orderNumber = String(req.body?.orderNumber || '');
    if (!intentId || !orderNumber) {
      return res.status(400).json({ error: 'Intent-ID und Bestellnummer erforderlich.' });
    }

    if (intentId.startsWith('pi_') && process.env.STRIPE_SECRET_KEY) {
      const resp = await fetch('https://api.stripe.com/v1/refunds', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ payment_intent: intentId }).toString(),
      });
      if (!resp.ok) {
        return res.status(502).json({ error: 'Stripe-Erstattung fehlgeschlagen.' });
      }
      return res.json({ refunded: true, provider: 'Stripe', orderNumber });
    }

    const session = sandboxSessions.get(intentId);
    if (session) {
      session.status = 'refunded';
    }
    return res.json({
      refunded: true,
      provider: session?.provider || 'Sandbox Provider',
      orderNumber,
      refundedAt: new Date().toISOString(),
    });
  });

  // Contact, Newsletter, and Stock Alert endpoint
  app.post('/api/enquiries', rateLimit(15, 60_000), async (req, res) => {
    const type = String(req.body?.type || 'contact');
    const email = String(req.body?.email || '').trim();
    const name = String(req.body?.name || '').trim();
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();

    if (!['contact', 'stock_alert', 'newsletter'].includes(type)) {
      return res.status(400).json({ error: 'Ungültiger Anfragetyp.' });
    }
    if (!email || !email.includes('@') || email.length > 160) {
      return res.status(400).json({ error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' });
    }
    if (type === 'contact' && (!name || !message)) {
      return res.status(400).json({ error: 'Name und Nachricht sind erforderlich.' });
    }

    const emailRes = await sendTransactionalEmail({
      to: email,
      subject:
        type === 'newsletter'
          ? 'Willkommen bei E-MOTION BIKES – Ihre Anmeldung'
          : type === 'stock_alert'
            ? 'Verfügbarkeitsbenachrichtigung vorgemerkt'
            : `Eingangsbestätigung: ${subject || 'Ihre Anfrage'}`,
      html: `<p>Vielen Dank für Ihre Nachricht an E-MOTION BIKES (Demo-Plattform).</p>`,
    });

    res.json({
      accepted: true,
      emailMode: emailRes.mode,
      emailDelivered: emailRes.delivered,
    });
  });

  // Order confirmation email notification
  app.post('/api/orders/notify', rateLimit(20, 60_000), async (req, res) => {
    const email = String(req.body?.customerEmail || '').trim();
    const orderNumber = String(req.body?.orderNumber || '').trim();
    const totalEur = Number(req.body?.totalEur || 0);
    if (!email || !orderNumber) {
      return res.status(400).json({ error: 'E-Mail und Bestellnummer erforderlich.' });
    }

    const emailRes = await sendTransactionalEmail({
      to: email,
      subject: `Bestellbestätigung ${orderNumber} – E-MOTION BIKES`,
      html: `<h2>Vielen Dank für Ihre Bestellung ${orderNumber}</h2><p>Gesamtbetrag: ${totalEur.toFixed(2)} € (inkl. 19 % MwSt.).</p>`,
    });

    res.json({
      notified: true,
      emailMode: emailRes.mode,
      emailDelivered: emailRes.delivered,
    });
  });

  // Vite dev middleware or static dist serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`E-MOTION BIKES server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
