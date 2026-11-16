import React, { useState } from 'react';
import { ArrowRight, Globe, Mail, MapPin, Phone } from 'lucide-react';
import { GERMAN_SEO_CITIES } from '../data/seedData';
import { useStore } from '../context/StoreContext';

export function Footer() {
  const {
    settings,
    categories,
    navigate,
    language,
    setLanguage,
    submitEnquiry,
    setOpenCookieSettings,
    pushToast,
  } = useStore();

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubmitting(true);
    const res = await submitEnquiry({ type: 'newsletter', email: newsletterEmail.trim() });
    setSubmitting(false);
    if (res.ok) {
      setNewsletterEmail('');
      pushToast(res.message, 'success');
    } else {
      pushToast(res.message, 'error');
    }
  };

  return (
    <footer className="bg-[#171C22] text-slate-300 border-t border-slate-800">
      {/* Newsletter & Trust Strip */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7">
            <h2 className="font-display text-lg sm:text-xl font-bold text-white">
              E-Bike Neuheiten, Testberichte & Angebote erhalten
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-xl">
              Monatliche Tipps zu Akku-Pflege, deutschen Verkehrsregeln und neuen Pedelec-Modellen.
            </p>
          </div>
          <form onSubmit={handleNewsletter} className="lg:col-span-5 flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="ihre@email-adresse.de"
              aria-label="E-Mail-Adresse für Newsletter"
              className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1677FF]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1677FF] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap shrink-0"
            >
              {submitting ? 'Wird gesendet...' : 'Anmelden'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <p className="font-display text-base font-extrabold text-white tracking-tight">
            {settings.brandName}
          </p>
          <p className="mt-1 text-xs text-slate-400">{settings.tagline}</p>
          <div className="mt-3.5 space-y-1.5 text-xs text-slate-400">
            <p className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#1677FF] shrink-0 mt-0.5" />
              <span>
                {settings.streetAddress}, {settings.postalCode} {settings.city}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#1677FF] shrink-0" />
              <span>{settings.contactPhone}</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#1677FF] shrink-0" />
              <span>{settings.contactEmail}</span>
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-white">Kategorien</h3>
          <ul className="mt-3 space-y-1.5 text-xs sm:text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <a
                  href={`/kategorie/${c.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/kategorie/${c.slug}`);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {c.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-white">Service & Beratung</h3>
          <ul className="mt-3 space-y-1.5 text-xs sm:text-sm">
            <li>
              <a
                href="/kaufberater"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/kaufberater');
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                E-Bike Kaufberater
              </a>
            </li>
            <li>
              <a
                href="/vergleich"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/vergleich');
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Modellvergleich (bis 4 Bikes)
              </a>
            </li>
            <li>
              <a
                href="/ratgeber"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/ratgeber');
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                E-Bike Wissenszentrum
              </a>
            </li>
            <li>
              <a
                href="/ueber-uns"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/ueber-uns');
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Über uns & Qualität
              </a>
            </li>
            <li>
              <a
                href="/konto"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/konto');
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Kundenkonto & Sendungsverfolgung
              </a>
            </li>
            <li>
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/admin');
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Admin-Dashboard
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-white">Rechtliches (DE / EU)</h3>
          <ul className="mt-3 space-y-1.5 text-xs sm:text-sm">
            {[
              { label: 'Impressum', path: '/impressum' },
              { label: 'Datenschutzerklärung', path: '/datenschutz' },
              { label: 'AGB', path: '/agb' },
              { label: 'Widerrufsbelehrung & Formular', path: '/widerruf' },
              { label: 'Versand- & Rückgabebedingungen', path: '/versand' },
            ].map((item) => (
              <li key={item.path}>
                <a
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setOpenCookieSettings(true)}
                className="text-slate-400 hover:text-white transition-colors text-left"
              >
                Cookie-Einstellungen
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Local German Delivery SEO Coverage */}
      <div className="border-t border-slate-800/80 bg-slate-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-xs text-slate-400 leading-relaxed">
            <span className="text-slate-300 font-medium">Deutschlandweiter Speditionsversand:</span>{' '}
            {GERMAN_SEO_CITIES.map((c) => c.name).join(' · ')}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <div className="inline-flex border border-slate-700 rounded-lg overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setLanguage('de')}
                className={`px-2.5 py-1 font-medium transition-colors ${
                  language === 'de' ? 'bg-[#1677FF] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                DE
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 font-medium transition-colors ${
                  language === 'en' ? 'bg-[#1677FF] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {settings.brandName}. {settings.footerNote}</p>
          <p className="font-mono-nums">EUR (€) · Europe/Berlin · Metrisch</p>
        </div>
      </div>
    </footer>
  );
}
