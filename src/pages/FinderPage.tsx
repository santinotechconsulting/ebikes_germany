import { useEffect, useMemo, useState } from 'react';
import { Compass, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { formatEur } from '../utils/format';
import { applySeoMetadata } from '../utils/seo';

type UsageGoal = 'all' | 'city' | 'trekking' | 'trail' | 'cargo' | 'compact' | 'suv';

export function FinderPage() {
  const { products, settings, navigate } = useStore();

  const [usage, setUsage] = useState<UsageGoal>('all');
  const [dailyKm, setDailyKm] = useState<'short' | 'medium' | 'long'>('medium');
  const [maxBudget, setMaxBudget] = useState<number>(6000);
  const [speedClass, setSpeedClass] = useState<'all' | '25' | '45'>('all');
  const [framePref, setFramePref] = useState<'all' | 'Tiefeinsteiger' | 'Diamant' | 'Trapez'>('all');

  useEffect(() => {
    applySeoMetadata({
      title: `E-Bike Kaufberater & Finder | ${settings.brandName}`,
      description:
        'In 4 Schritten zum passenden E-Bike: Einsatzbereich, tägliche Strecke, Budget und Antriebstyp für Deutschland auswählen.',
      canonicalPath: '/kaufberater',
      siteName: settings.brandName,
    });
  }, [settings.brandName]);

  const recommendations = useMemo(() => {
    const published = products.filter((p) => p.published);

    const scored = published.map((p) => {
      let score = 0;

      if (usage === 'all') score += 20;
      else if (usage === 'city' && p.categoryId === 'city-ebikes') score += 45;
      else if (usage === 'trekking' && p.categoryId === 'trekking-ebikes') score += 45;
      else if (usage === 'trail' && p.categoryId === 'e-mountainbikes') score += 45;
      else if (usage === 'cargo' && p.categoryId === 'cargo-ebikes') score += 45;
      else if (usage === 'compact' && p.categoryId === 'folding-ebikes') score += 45;
      else if (usage === 'suv' && p.categoryId === 'suv-ebikes') score += 45;

      if (dailyKm === 'short' && p.batteryWh >= 400) score += 15;
      if (dailyKm === 'medium' && p.batteryWh >= 600) score += 20;
      if (dailyKm === 'long' && p.batteryWh >= 725) score += 25;

      if (p.priceEur <= maxBudget) score += 25;
      else score -= 35;

      if (speedClass === 'all') score += 10;
      else if (speedClass === '25' && p.maxAssistedSpeedKmh === 25) score += 20;
      else if (speedClass === '45' && p.maxAssistedSpeedKmh === 45) score += 30;
      else score -= 25;

      if (framePref === 'all' || p.frameType === framePref) score += 10;

      if (p.stock > 0) score += 5;

      return { product: p, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [products, usage, dailyKm, maxBudget, speedClass, framePref]);

  const resetFinder = () => {
    setUsage('all');
    setDailyKm('medium');
    setMaxBudget(6000);
    setSpeedClass('all');
    setFramePref('all');
  };

  return (
    <main className="bg-[#F4F6F8] min-h-[75vh] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1677FF]">
                <Compass className="w-4 h-4" />
                Interaktiver E-Bike Berater
              </p>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-[#171C22]">
                Welches E-Bike passt zu Ihnen?
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                Wählen Sie Ihren Einsatzzweck, Ihre geplante Tagesdistanz und Ihr Budget – wir zeigen Ihnen passende Modelle aus dem aktuellen Katalog.
              </p>
            </div>
            <button
              type="button"
              onClick={resetFinder}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:border-[#171C22] hover:text-[#171C22] transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Auswahl zurücksetzen
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                1. Haupteinsatzbereich
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['all', 'Alle Typen'],
                    ['city', 'Stadt & Pendeln'],
                    ['trekking', 'Tour & Reisen'],
                    ['trail', 'Berge & Trails'],
                    ['suv', 'Allround / SUV'],
                    ['cargo', 'Lasten & Familie'],
                    ['compact', 'Kompakt / Faltbar'],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setUsage(val)}
                    className={`px-3 py-2 text-xs font-medium rounded-md border text-left transition-colors ${
                      usage === val
                        ? 'bg-[#171C22] text-white border-[#171C22]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                2. Typische Tagesstrecke
              </label>
              <div className="space-y-2">
                {(
                  [
                    ['short', 'Kurzstrecke (bis 25 km/Tag)'],
                    ['medium', 'Pendler & Ausflug (25–70 km)'],
                    ['long', 'Langstrecke & Alpen (70+ km)'],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDailyKm(val)}
                    className={`w-full px-3 py-2 text-xs font-medium rounded-md border text-left transition-colors ${
                      dailyKm === val
                        ? 'bg-[#171C22] text-white border-[#171C22]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                3. Maximales Budget
              </label>
              <div className="bg-[#F4F6F8] p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between text-sm font-bold text-[#171C22] tabular-nums">
                  <span>Bis</span>
                  <span>{formatEur(maxBudget)}</span>
                </div>
                <input
                  type="range"
                  min={2200}
                  max={7500}
                  step={100}
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  className="mt-3 w-full accent-[#1677FF]"
                />
                <div className="mt-1 flex justify-between text-[11px] text-slate-500 tabular-nums">
                  <span>2.200 €</span>
                  <span>7.500 €</span>
                </div>
              </div>

              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mt-4 mb-2">
                4. Rahmenform
              </label>
              <select
                value={framePref}
                onChange={(e) => setFramePref(e.target.value as typeof framePref)}
                className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white text-[#171C22]"
              >
                <option value="all">Keine Vorgabe</option>
                <option value="Tiefeinsteiger">Tiefeinsteiger (komfortabler Einstieg)</option>
                <option value="Trapez">Trapez (sportlich-komfortabel)</option>
                <option value="Diamant">Diamant (klassisch-steif)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                5. Antriebsklasse (StVZO)
              </label>
              <div className="space-y-2">
                {(
                  [
                    ['all', 'Alle (25 & 45 km/h)'],
                    ['25', 'Pedelec 25 km/h (ohne Führerschein)'],
                    ['45', 'S-Pedelec 45 km/h (Kennzeichenpflicht)'],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSpeedClass(val)}
                    className={`w-full px-3 py-2 text-xs font-medium rounded-md border text-left transition-colors ${
                      speedClass === val
                        ? 'bg-[#171C22] text-white border-[#171C22]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
                Hinweis: S-Pedelecs (45 km/h) benötigen in Deutschland ein Versicherungskennzeichen, Helm und Fahrerlaubnis AM.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#1677FF]" />
              <h2 className="font-display text-2xl font-bold text-[#171C22]">
                Ihre passenden E-Bike Empfehlungen
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/vergleich')}
              className="text-sm font-semibold text-[#1677FF] hover:underline"
            >
              Empfehlungen im Direktvergleich ansehen →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map(({ product }) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
