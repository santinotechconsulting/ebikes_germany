import { useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  Cookie,
  HelpCircle,
  MessageCircle,
  Phone,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function Overlays() {
  const {
    settings,
    cookieConsent,
    updateCookieConsent,
    openCookieSettings,
    setOpenCookieSettings,
    compareIds,
    navigate,
    currentPath,
    toasts,
  } = useStore();

  const [analyticsOptIn, setAnalyticsOptIn] = useState(cookieConsent?.analytics ?? false);
  const [marketingOptIn, setMarketingOptIn] = useState(cookieConsent?.marketing ?? false);
  const [supportOpen, setSupportOpen] = useState(false);

  const showConsentModal = !cookieConsent || openCookieSettings;

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2.5 ${
              toast.tone === 'success'
                ? 'bg-[#171C22] text-white border-slate-700'
                : toast.tone === 'error'
                  ? 'bg-red-700 text-white border-red-800'
                  : 'bg-white text-[#171C22] border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1677FF]" />
            <span>{toast.text}</span>
          </div>
        ))}
      </div>

      {/* Compare Bar (when >= 1 bike selected and not already on /vergleich or /admin) */}
      {compareIds.length > 0 && currentPath !== '/vergleich' && !currentPath.startsWith('/admin') && (
        <div className="fixed bottom-4 left-4 z-40">
          <button
            type="button"
            onClick={() => navigate('/vergleich')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#171C22] text-white text-xs font-semibold rounded-xl shadow-lg hover:bg-[#1677FF] transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Vergleich ({compareIds.length}/4)</span>
          </button>
        </div>
      )}

      {/* Floating Customer Support Button */}
      {!currentPath.startsWith('/admin') && (
        <div className="fixed bottom-4 right-4 z-40">
          {supportOpen && (
            <div className="mb-3 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-display text-sm font-bold text-[#171C22]">
                  E-Bike Fachberatung
                </h3>
                <button
                  type="button"
                  onClick={() => setSupportOpen(false)}
                  aria-label="Beratungsfenster schließen"
                  className="text-slate-400 hover:text-[#171C22]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                Fragen zu Rahmengröße, Pedelec-Regeln oder Speditionsversand? Unser Team hilft gerne weiter.
              </p>
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setSupportOpen(false);
                    navigate('/kontakt');
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#1677FF] text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Kontaktformular & Showroom
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSupportOpen(false);
                    navigate('/kaufberater');
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#F4F6F8] text-[#171C22] text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Interaktiver Kaufberater
                </button>
                {settings.whatsappNumber && (
                  <a
                    href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Beratung
                  </a>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                <Phone className="w-3.5 h-3.5" />
                <span>{settings.contactPhone}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSupportOpen((v) => !v)}
            aria-label="Kundenberatung öffnen"
            className="inline-flex items-center gap-2 px-4 py-3 bg-[#1677FF] text-white text-xs font-semibold rounded-xl shadow-lg hover:bg-blue-600 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Beratung</span>
          </button>
        </div>
      )}

      {/* GDPR / TDDDG Cookie Consent Banner */}
      {showConsentModal && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-20 md:max-w-md z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Cookie className="w-4 h-4 text-[#1677FF]" />
              <h3 className="font-display text-sm font-bold text-[#171C22]">
                Datenschutz & Cookie-Einwilligung
              </h3>
            </div>
            {cookieConsent && (
              <button
                type="button"
                onClick={() => setOpenCookieSettings(false)}
                aria-label="Cookie-Einstellungen schließen"
                className="text-slate-400 hover:text-[#171C22]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Wir nutzen technisch notwendige Cookies für Warenkorb und Sicherheit. Optionale Analyse- und Marketing-Dienste (z. B. GA4) werden erst nach Ihrer Zustimmung aktiviert (§ 25 TDDDG).
          </p>

          <div className="mt-3 space-y-2 text-xs">
            <label className="flex items-center justify-between py-1.5 px-2.5 bg-[#F4F6F8] rounded-lg">
              <span className="font-medium text-[#171C22]">Technisch notwendig</span>
              <span className="text-slate-500">Immer aktiv</span>
            </label>
            <label className="flex items-center justify-between py-1.5 px-2.5 bg-[#F4F6F8] rounded-lg cursor-pointer">
              <span className="text-[#171C22]">Statistik & Webanalyse (GA4 / GTM)</span>
              <input
                type="checkbox"
                checked={analyticsOptIn}
                onChange={(e) => setAnalyticsOptIn(e.target.checked)}
                className="accent-[#1677FF] w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between py-1.5 px-2.5 bg-[#F4F6F8] rounded-lg cursor-pointer">
              <span className="text-[#171C22]">Marketing & Conversion-Tracking</span>
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="accent-[#1677FF] w-4 h-4"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateCookieConsent(false, false)}
              className="flex-1 px-3 py-2 text-xs font-semibold border border-slate-300 text-[#171C22] rounded-lg hover:bg-slate-50 whitespace-nowrap"
            >
              Nur notwendige
            </button>
            <button
              type="button"
              onClick={() => updateCookieConsent(analyticsOptIn, marketingOptIn)}
              className="px-3 py-2 text-xs font-semibold border border-slate-300 text-[#171C22] rounded-lg hover:bg-slate-50 whitespace-nowrap"
            >
              Auswahl speichern
            </button>
            <button
              type="button"
              onClick={() => updateCookieConsent(true, true)}
              className="flex-1 px-3 py-2 text-xs font-semibold bg-[#171C22] text-white rounded-lg hover:bg-[#1677FF] whitespace-nowrap"
            >
              Alle akzeptieren
            </button>
          </div>
        </div>
      )}
    </>
  );
}
