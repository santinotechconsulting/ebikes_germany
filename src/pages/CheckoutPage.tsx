import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Lock,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Order, PaymentMethod } from '../types/store';
import { trackConversionEvent } from '../utils/analytics';
import { createSafeId, formatEur } from '../utils/format';
import { downloadOrderInvoicePdf } from '../utils/invoicePdf';
import { applySeoMetadata } from '../utils/seo';

const PAYMENT_LABELS: Record<PaymentMethod, { title: string; subtitle: string }> = {
  card: {
    title: 'Kredit- oder Debitkarte (Stripe / Sandbox)',
    subtitle: 'Sofortige serverseitige Zahlungsautorisierung. Es werden keine Kartendaten gespeichert.',
  },
  paypal: {
    title: 'PayPal (Sandbox / Mollie)',
    subtitle: 'Direkte Autorisierung mit Bestellschutz.',
  },
  klarna: {
    title: 'Klarna Rechnung / Ratenkauf (Sandbox / Mollie)',
    subtitle: 'Erst fahren, flexibel zahlen.',
  },
  sepa: {
    title: 'SEPA-Lastschrift',
    subtitle: 'Bequemer Bankeinzug innerhalb Deutschlands.',
  },
  bank_transfer: {
    title: 'Vorkasse / Überweisung',
    subtitle: 'Bestellung wird erfasst; Zahlungsstatus bleibt bis zum Geldeingang auf Ausstehend.',
  },
};

export function CheckoutPage() {
  const {
    cart,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTotal,
    appliedCoupon,
    clearCart,
    createOrderRecord,
    firebaseUser,
    userProfile,
    settings,
    publicConfig,
    navigate,
    pushToast,
  } = useStore();

  const defaultAddr = userProfile?.addresses?.[0];
  const [email, setEmail] = useState(firebaseUser?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [firstName, setFirstName] = useState(defaultAddr?.firstName || '');
  const [lastName, setLastName] = useState(defaultAddr?.lastName || '');
  const [street, setStreet] = useState(defaultAddr?.street || '');
  const [postalCode, setPostalCode] = useState(defaultAddr?.postalCode || '');
  const [city, setCity] = useState(defaultAddr?.city || '');
  const [country, setCountry] = useState(defaultAddr?.country || 'Deutschland');
  const [sameBilling, setSameBilling] = useState(true);
  const [billFirstName, setBillFirstName] = useState('');
  const [billLastName, setBillLastName] = useState('');
  const [billStreet, setBillStreet] = useState('');
  const [billPostalCode, setBillPostalCode] = useState('');
  const [billCity, setBillCity] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    settings.paymentMethods[0] || 'card'
  );
  const [acceptedAgb, setAcceptedAgb] = useState(false);
  const [acceptedSPedelecNote, setAcceptedSPedelecNote] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const hasSPedelec = cart.some((item) => item.isSPedelec);

  useEffect(() => {
    applySeoMetadata({
      title: `Sichere Kasse | ${settings.brandName}`,
      description: 'Schließen Sie Ihre E-Bike Bestellung sicher ab.',
      canonicalPath: '/checkout',
      noindex: true,
      siteName: settings.brandName,
    });
    if (cart.length > 0) {
      trackConversionEvent('begin_checkout', {
        currency: 'EUR',
        value: cartTotal,
        items: cart.map((i) => ({ item_id: i.sku, item_name: i.name, price: i.priceEur, quantity: i.quantity })),
      });
    }
  }, [settings.brandName]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('Ihr Warenkorb ist leer.');
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !street.trim() || !postalCode.trim() || !city.trim()) {
      setErrorMsg('Bitte füllen Sie alle Pflichtfelder zur Lieferanschrift aus.');
      return;
    }
    if (!/^\d{5}$/.test(postalCode.trim()) && country === 'Deutschland') {
      setErrorMsg('Bitte geben Sie eine gültige 5-stellige deutsche Postleitzahl ein.');
      return;
    }
    if (!acceptedAgb) {
      setErrorMsg('Bitte bestätigen Sie die AGB und die Widerrufsbelehrung.');
      return;
    }
    if (hasSPedelec && !acceptedSPedelecNote) {
      setErrorMsg('Bitte bestätigen Sie den Hinweis zu S-Pedelec-Pflichten (45 km/h).');
      return;
    }

    setSubmitting(true);
    const orderNumber = `EMB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // 1. Create server-side payment session
      const sessionResp = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountEur: cartTotal,
          paymentMethod,
          customerEmail: email.trim(),
          orderNumber,
        }),
      });
      const sessionData = await sessionResp.json();
      if (!sessionResp.ok) {
        throw new Error(sessionData.error || 'Zahlungssitzung konnte nicht gestartet werden.');
      }

      // 2. Verify payment with server before marking order paid
      const verifyResp = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentId: sessionData.intentId,
          signature: sessionData.signature,
          amountEur: cartTotal,
          paymentMethod,
          simulateFailure,
        }),
      });
      const verifyData = await verifyResp.json();
      if (!verifyResp.ok) {
        throw new Error(verifyData.error || 'Zahlungsverifizierung abgelehnt.');
      }

      const now = new Date().toISOString();
      const shippingAddr = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        street: street.trim(),
        postalCode: postalCode.trim(),
        city: city.trim(),
        country,
      };
      const billingAddr = sameBilling
        ? shippingAddr
        : {
            firstName: billFirstName.trim() || shippingAddr.firstName,
            lastName: billLastName.trim() || shippingAddr.lastName,
            street: billStreet.trim() || shippingAddr.street,
            postalCode: billPostalCode.trim() || shippingAddr.postalCode,
            city: billCity.trim() || shippingAddr.city,
            country,
          };

      const order: Order = {
        id: createSafeId('ord'),
        orderNumber,
        userId: firebaseUser?.uid || 'guest',
        customerEmail: email.trim(),
        customerName: `${shippingAddr.firstName} ${shippingAddr.lastName}`,
        customerPhone: phone.trim(),
        shippingAddress: shippingAddr,
        billingAddress: billingAddr,
        deliveryInstructions: deliveryInstructions.trim(),
        items: cart.map((c) => ({
          productId: c.productId,
          sku: c.sku,
          name: c.name,
          brand: c.brand,
          color: c.color,
          frameSize: c.frameSize,
          unitPriceEur: c.priceEur,
          quantity: c.quantity,
          image: c.image,
        })),
        subtotalEur: cartSubtotal,
        discountCode: appliedCoupon?.code,
        discountEur: cartDiscount,
        shippingEur: cartShipping,
        totalEur: cartTotal,
        paymentMethod,
        paymentProvider: verifyData.provider || sessionData.provider || 'Sandbox',
        paymentIntentId: sessionData.intentId,
        paymentStatus: verifyData.paymentStatus || 'pending',
        orderStatus: verifyData.orderStatus || 'pending',
        createdAt: now,
        updatedAt: now,
      };

      await createOrderRecord(order);

      // 3. Dispatch order confirmation notification
      await fetch('/api/orders/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: order.customerEmail,
          orderNumber: order.orderNumber,
          totalEur: order.totalEur,
        }),
      }).catch(() => {});

      trackConversionEvent('purchase', {
        transaction_id: order.orderNumber,
        currency: 'EUR',
        value: order.totalEur,
      });

      clearCart();
      setConfirmedOrder(order);
      pushToast(`Bestellung ${order.orderNumber} erfolgreich erfasst!`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bestellung konnte nicht abgeschlossen werden.';
      setErrorMsg(msg);
      pushToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <main className="bg-[#F4F6F8] min-h-[75vh] py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10">
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="w-8 h-8 shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider">
                  Bestellbestätigung (Demo / Sandbox)
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#171C22]">
                  Vielen Dank, {confirmedOrder.shippingAddress.firstName}!
                </h1>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#F4F6F8] p-4 rounded-lg text-sm">
              <div>
                <p className="text-xs text-slate-500">Bestellnummer</p>
                <p className="font-mono font-bold text-[#171C22]">{confirmedOrder.orderNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Zahlungsstatus</p>
                <p className="font-semibold text-[#171C22]">
                  {confirmedOrder.paymentStatus === 'verified'
                    ? 'Verifiziert & Bezahlt'
                    : 'Ausstehend (Vorkasse)'}{' '}
                  · {confirmedOrder.paymentProvider}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Gesamtbetrag</p>
                <p className="font-bold text-[#171C22] tabular-nums">
                  {formatEur(confirmedOrder.totalEur)}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5 space-y-2 text-sm">
              <p className="font-semibold text-[#171C22]">Lieferanschrift:</p>
              <p className="text-slate-600">
                {confirmedOrder.customerName} · {confirmedOrder.shippingAddress.street},{' '}
                {confirmedOrder.shippingAddress.postalCode} {confirmedOrder.shippingAddress.city} ({confirmedOrder.shippingAddress.country})
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => downloadOrderInvoicePdf(confirmedOrder, settings)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#171C22] text-white text-sm font-semibold rounded-md hover:bg-[#1677FF] transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF-Rechnung herunterladen
              </button>
              <button
                type="button"
                onClick={() => navigate('/konto')}
                className="px-5 py-3 border border-slate-300 text-[#171C22] text-sm font-semibold rounded-md hover:border-[#171C22] transition-colors"
              >
                Zum Kundenkonto
              </button>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-[#171C22]"
              >
                Weiter einkaufen
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#F4F6F8] min-h-[75vh] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              <Lock className="w-3.5 h-3.5" />
              Verschlüsselte Kasse · Server-Verifizierung
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-[#171C22]">
              Zur Kasse
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Zahlungsmodus:{' '}
            {publicConfig.stripeConfigured || publicConfig.mollieConfigured
              ? 'Live / Test-API konfiguriert'
              : 'Signierter Sandbox-Checkout (Demo)'}
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-lg mx-auto">
            <p className="text-slate-600 text-sm">Ihr Warenkorb ist leer.</p>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="mt-4 px-5 py-2.5 bg-[#171C22] text-white text-sm font-semibold rounded-md"
            >
              Zurück zum Shop
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-4 flex items-start gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Contact & Shipping */}
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-[#171C22]">
                  1. Kontaktdaten & Lieferanschrift (Deutschland)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      E-Mail-Adresse *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@beispiel.de"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Telefon für Speditions-Avis *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+49 170 1234567"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Vorname *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nachname *</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Straße & Hausnummer *
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Musterstraße 42"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">PLZ *</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="80331"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Ort *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="München"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Land</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white"
                    >
                      <option value="Deutschland">Deutschland</option>
                      <option value="Österreich">Österreich</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Lieferhinweis (optional)
                    </label>
                    <input
                      type="text"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      placeholder="z. B. Anlieferung werktags ab 14 Uhr"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700 pt-2">
                  <input
                    type="checkbox"
                    checked={sameBilling}
                    onChange={(e) => setSameBilling(e.target.checked)}
                    className="accent-[#1677FF]"
                  />
                  Rechnungsadresse entspricht der Lieferanschrift
                </label>

                {!sameBilling && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <input
                      type="text"
                      placeholder="Rechnung Vorname"
                      value={billFirstName}
                      onChange={(e) => setBillFirstName(e.target.value)}
                      className="px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Rechnung Nachname"
                      value={billLastName}
                      onChange={(e) => setBillLastName(e.target.value)}
                      className="px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Straße & Hausnummer"
                      value={billStreet}
                      onChange={(e) => setBillStreet(e.target.value)}
                      className="sm:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="PLZ"
                      value={billPostalCode}
                      onChange={(e) => setBillPostalCode(e.target.value)}
                      className="px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Stadt"
                      value={billCity}
                      onChange={(e) => setBillCity(e.target.value)}
                      className="px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                )}
              </section>

              {/* Payment Method */}
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-[#171C22]">
                  2. Zahlungsart wählen
                </h2>
                <div className="space-y-3">
                  {settings.paymentMethods.map((method) => {
                    const info = PAYMENT_LABELS[method];
                    return (
                      <label
                        key={method}
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                          paymentMethod === method
                            ? 'border-[#1677FF] bg-[#1677FF]/5'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={() => setPaymentMethod(method)}
                          className="mt-1 accent-[#1677FF]"
                        />
                        <div>
                          <p className="text-sm font-semibold text-[#171C22]">{info.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{info.subtitle}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {paymentMethod !== 'bank_transfer' && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs text-slate-500">
                      <input
                        type="checkbox"
                        checked={simulateFailure}
                        onChange={(e) => setSimulateFailure(e.target.checked)}
                        className="accent-rose-600"
                      />
                      Sandbox-Test: Abgelehnte Zahlungsautorisierung simulieren
                    </label>
                  </div>
                )}
              </section>

              {/* Legal Checkboxes */}
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 text-sm">
                <label className="flex items-start gap-2.5 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedAgb}
                    onChange={(e) => setAcceptedAgb(e.target.checked)}
                    className="mt-1 accent-[#1677FF]"
                  />
                  <span>
                    Ich akzeptiere die{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/agb')}
                      className="text-[#1677FF] underline"
                    >
                      Allgemeinen Geschäftsbedingungen (AGB)
                    </button>{' '}
                    und habe die{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/widerruf')}
                      className="text-[#1677FF] underline"
                    >
                      Widerrufsbelehrung
                    </button>{' '}
                    sowie die{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/datenschutz')}
                      className="text-[#1677FF] underline"
                    >
                      Datenschutzerklärung
                    </button>{' '}
                    zur Kenntnis genommen. *
                  </span>
                </label>

                {hasSPedelec && (
                  <label className="flex items-start gap-2.5 text-amber-800 bg-amber-50 p-3 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedSPedelecNote}
                      onChange={(e) => setAcceptedSPedelecNote(e.target.checked)}
                      className="mt-1 accent-[#1677FF]"
                    />
                    <span className="text-xs leading-relaxed">
                      Mir ist bekannt, dass das ausgewählte S-Pedelec (45 km/h) in Deutschland zulassungs- und versicherungspflichtig (Versicherungskennzeichen), helmpflichtig sowie auf Radwegen ohne Freigabe nicht zugelassen ist (Mindestalter/Führerschein Klasse AM erforderlich). *
                    </span>
                  </label>
                )}
              </section>
            </div>

            {/* Summary Sidebar */}
            <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4 sticky top-24">
              <h2 className="font-display text-lg font-bold text-[#171C22]">
                Bestellzusammenfassung
              </h2>

              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={`${item.productId}-${item.color}-${item.frameSize}`}
                    className="py-2.5 flex justify-between gap-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-[#171C22]">
                        {item.quantity} × {item.brand} {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.color} · Rahmen {item.frameSize}
                      </p>
                    </div>
                    <span className="font-semibold text-[#171C22] tabular-nums shrink-0">
                      {formatEur(item.priceEur * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-2 text-sm tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span>Zwischensumme</span>
                  <span>{formatEur(cartSubtotal)}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Gutschein ({appliedCoupon?.code})</span>
                    <span>−{formatEur(cartDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Versand</span>
                  <span>{cartShipping === 0 ? 'Kostenlos' : formatEur(cartShipping)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-[#171C22]">Gesamtbetrag</span>
                  <span className="font-display text-2xl font-bold text-[#171C22]">
                    {formatEur(cartTotal)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 text-right">
                  inkl. 19 % gesetzl. MwSt. ({formatEur(cartTotal - cartTotal / 1.19)})
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-5 bg-[#1677FF] text-white font-semibold text-sm rounded-md hover:bg-[#1262d4] disabled:bg-slate-300 transition-colors"
              >
                {submitting ? 'Zahlung wird serverseitig geprüft...' : 'Zahlungspflichtig bestellen'}
              </button>

              <div className="space-y-2 pt-2 text-xs text-slate-500">
                <p className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                  Avisierte Speditionszustellung in 3–5 Werktagen (DE)
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  Checkout ohne Speicherung sensibler Kartendaten
                </p>
              </div>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}
