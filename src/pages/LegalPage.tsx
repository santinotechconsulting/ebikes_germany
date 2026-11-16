import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatEur } from '../utils/format';
import { applySeoMetadata } from '../utils/seo';

export type LegalPageKind = 'impressum' | 'datenschutz' | 'agb' | 'widerruf' | 'versand';

const PAGE_META: Record<LegalPageKind, { title: string; path: string }> = {
  impressum: { title: 'Impressum (Muster)', path: '/impressum' },
  datenschutz: { title: 'Datenschutzerklärung (Muster)', path: '/datenschutz' },
  agb: { title: 'Allgemeine Geschäftsbedingungen (Muster)', path: '/agb' },
  widerruf: { title: 'Widerrufsbelehrung & Widerrufsformular', path: '/widerruf' },
  versand: { title: 'Versand-, Liefer- & Garantiebedingungen', path: '/versand' },
};

export function LegalPage({ kind }: { kind: LegalPageKind }) {
  const { settings, submitEnquiry, pushToast } = useStore();
  const meta = PAGE_META[kind];

  const [revName, setRevName] = useState('');
  const [revEmail, setRevEmail] = useState('');
  const [revOrderNumber, setRevOrderNumber] = useState('');
  const [revSubmitted, setRevSubmitted] = useState(false);

  useEffect(() => {
    applySeoMetadata({
      title: `${meta.title} | ${settings.brandName}`,
      description: `${meta.title} für den Online-Shop ${settings.brandName} in Deutschland.`,
      canonicalPath: meta.path,
      siteName: settings.brandName,
    });
  }, [meta.title, meta.path, settings.brandName]);

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await submitEnquiry({
      type: 'contact',
      name: revName,
      email: revEmail,
      subject: `Widerruf Bestellung ${revOrderNumber}`,
      message: `Hiermit widerrufe(n) ich/wir den geschlossenen Vertrag über die Bestellung ${revOrderNumber}.`,
    });
    if (res.ok) {
      setRevSubmitted(true);
      pushToast('Widerrufsformular übermittelt.', 'success');
    } else {
      pushToast(res.message, 'error');
    }
  };

  let bodyText = '';
  if (kind === 'impressum') bodyText = settings.legalImpressum;
  else if (kind === 'datenschutz') bodyText = settings.legalDatenschutz;
  else if (kind === 'agb') bodyText = settings.legalAgb;
  else if (kind === 'widerruf') bodyText = settings.legalWiderruf;
  else {
    bodyText = `VERSAND- & LIEFERBEDINGUNGEN IN DEUTSCHLAND (MUSTER)

1. Speditionsversand von E-Bikes
Jedes E-Bike wird vor Übergabe durch geschulte Zweiradmechaniker endmontiert und geprüft. Der Versand erfolgt per spezialisierter Fahrrad-Spedition inklusive telefonischem Lieferavis (3–5 Werktage nach Zahlungseingang innerhalb Deutschlands).

2. Versandkosten
Ab einem Bestellwert von ${formatEur(settings.freeShippingThresholdEur)} liefern wir innerhalb des deutschen Festlands versandkostenfrei. Unterhalb dieses Betrags fällt eine pauschale Speditionsgebühr von ${formatEur(settings.standardShippingEur)} (inkl. 19 % MwSt.) an.

3. Gesetzliche Gewährleistung & Herstellergarantie
Es gilt die gesetzliche Mängelhaftung von 2 Jahren ab Übergabe. Eventuelle freiwillige Herstellergarantien auf Rahmen oder Motoren richten sich ausschließlich nach den im jeweiligen Produktdatensatz hinterlegten Bedingungen.`;
  }

  return (
    <main className="bg-[#F4F6F8] min-h-[75vh] py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Hinweis: Diese Vorlage ist ein anpassbarer Mustertext im Demo-Shop und ersetzt keine individuelle Rechtsberatung. Vor produktivem Livebetrieb in Deutschland müssen alle Pflichtangaben vollständig im Admin-Dashboard hinterlegt und juristisch geprüft werden.
          </span>
        </div>

        <article className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1677FF]">
            <FileText className="w-4 h-4" />
            Rechtliches & Informationen
          </div>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#171C22]">
            {meta.title}
          </h1>
          <div className="mt-6 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {bodyText}
          </div>
        </article>

        {kind === 'widerruf' && (
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-[#171C22]">
              Online-Widerrufsformular (Muster nach Anlage 2 zu Art. 246a § 1 Abs. 2 S. 1 Nr. 1 EGBGB)
            </h2>
            {revSubmitted ? (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3 text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Ihre Widerrufserklärung für Bestellung {revOrderNumber} wurde übermittelt.</span>
              </div>
            ) : (
              <form onSubmit={handleWithdrawalSubmit} className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Vor- und Nachname *"
                  value={revName}
                  onChange={(e) => setRevName(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-md"
                />
                <input
                  type="email"
                  required
                  placeholder="E-Mail-Adresse *"
                  value={revEmail}
                  onChange={(e) => setRevEmail(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-md"
                />
                <input
                  type="text"
                  required
                  placeholder="Bestellnummer (z. B. EMB-...) *"
                  value={revOrderNumber}
                  onChange={(e) => setRevOrderNumber(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-md"
                />
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#171C22] text-white text-sm font-semibold rounded-md hover:bg-[#1677FF] transition-colors"
                  >
                    Widerruf verbindlich absenden
                  </button>
                </div>
              </form>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
