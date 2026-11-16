import { useEffect, useMemo } from 'react';
import { ArrowLeftRight, CheckCircle2, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { formatEur } from '../utils/format';
import { applySeoMetadata } from '../utils/seo';

export function ComparePage() {
  const {
    products,
    compareIds,
    toggleCompare,
    clearCompare,
    addToCart,
    navigate,
    settings,
  } = useStore();

  useEffect(() => {
    applySeoMetadata({
      title: `E-Bike Modellvergleich | ${settings.brandName}`,
      description:
        'Bis zu vier E-Bikes direkt miteinander vergleichen: Motor, Drehmoment, Akku-Kapazität, Reichweite, Schaltung, Bremsen, Gewicht und Preis.',
      canonicalPath: '/vergleich',
      siteName: settings.brandName,
    });
  }, [settings.brandName]);

  const publishedProducts = useMemo(() => products.filter((p) => p.published), [products]);
  const selectedProducts = useMemo(
    () =>
      compareIds
        .map((id) => publishedProducts.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .slice(0, 4),
    [compareIds, publishedProducts]
  );

  const availableToAdd = useMemo(
    () => publishedProducts.filter((p) => !compareIds.includes(p.id)),
    [publishedProducts, compareIds]
  );

  const specRows: { label: string; render: (p: (typeof selectedProducts)[number]) => string }[] = [
    { label: 'Kategorie', render: (p) => p.categoryName },
    { label: 'Preis (inkl. 19 % MwSt.)', render: (p) => formatEur(p.priceEur) },
    { label: 'Motor & Modell', render: (p) => `${p.motorBrand} ${p.motorModel}` },
    { label: 'Motorleistung', render: (p) => `${p.motorPowerW} W` },
    { label: 'Max. Drehmoment', render: (p) => `${p.motorTorqueNm} Nm` },
    { label: 'Unterstützung bis', render: (p) => `${p.maxAssistedSpeedKmh} km/h${p.isSPedelec ? ' (S-Pedelec)' : ' (Pedelec)'}` },
    { label: 'Akkukapazität', render: (p) => `${p.batteryWh} Wh` },
    { label: 'Ladezeit (ca.)', render: (p) => `${p.chargingTimeHours} Stunden` },
    { label: 'Geschätzte Reichweite*', render: (p) => `${p.rangeKmMin}–${p.rangeKmMax} km` },
    { label: 'Rahmentyp', render: (p) => p.frameType },
    { label: 'Rahmenmaterial', render: (p) => p.frameMaterial },
    { label: 'Rahmengrößen', render: (p) => p.frameSizes.join(', ') },
    { label: 'Bremssystem', render: (p) => p.brakeSystem },
    { label: 'Schaltung', render: (p) => p.gearSystem },
    { label: 'Gewicht (ca.)', render: (p) => `${p.weightKg} kg` },
    { label: 'Garantie', render: (p) => `${p.warrantyYears} Jahre (Rahmen laut Hersteller)` },
    { label: 'Verfügbarkeit', render: (p) => (p.stock > 0 ? `Sofort lieferbar (${p.stock})` : 'Derzeit vergriffen') },
  ];

  return (
    <main className="bg-white min-h-[70vh] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1677FF]">
              Direktvergleich
            </p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-[#171C22]">
              E-Bikes im Modellvergleich
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Vergleichen Sie bis zu vier Elektrofahrräder anhand technischer Kenndaten, Reichweite und Ausstattung auf einen Blick.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {availableToAdd.length > 0 && selectedProducts.length < 4 && (
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-slate-500" />
                <select
                  aria-label="E-Bike zum Vergleich hinzufügen"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      toggleCompare(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="text-sm border border-slate-300 rounded-md px-3 py-2 bg-white text-[#171C22] focus:outline-none focus:border-[#1677FF]"
                >
                  <option value="" disabled>
                    Modell hinzufügen ({selectedProducts.length}/4)
                  </option>
                  {availableToAdd.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brand} {p.name} ({formatEur(p.priceEur)})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {selectedProducts.length > 0 && (
              <button
                type="button"
                onClick={clearCompare}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Liste leeren
              </button>
            )}
          </div>
        </div>

        {selectedProducts.length === 0 ? (
          <div className="mt-12 bg-[#F4F6F8] rounded-xl p-10 text-center max-w-2xl mx-auto">
            <ArrowLeftRight className="w-10 h-10 text-slate-400 mx-auto" />
            <h2 className="mt-4 font-display text-xl font-bold text-[#171C22]">
              Noch keine E-Bikes zum Vergleich ausgewählt
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Wählen Sie oben ein Modell aus dem Dropdown oder klicken Sie im Shop auf „Vergleichen“, um bis zu 4 E-Bikes gegenüberzustellen.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="px-5 py-2.5 bg-[#171C22] text-white text-sm font-semibold rounded-md hover:bg-[#1677FF] transition-colors"
              >
                Zum E-Bike Katalog
              </button>
              <button
                type="button"
                onClick={() => {
                  publishedProducts.slice(0, 3).forEach((p) => toggleCompare(p.id));
                }}
                className="px-5 py-2.5 bg-white border border-slate-300 text-[#171C22] text-sm font-semibold rounded-md hover:border-[#171C22] transition-colors"
              >
                3 beliebte Modelle vergleichen
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F4F6F8]/60 align-top">
                    <th className="p-4 w-52 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Modellübersicht
                    </th>
                    {selectedProducts.map((product) => (
                      <th key={product.id} className="p-4 min-w-[210px] border-l border-slate-200 font-normal">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            {product.brand}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleCompare(product.id)}
                            aria-label={`${product.name} entfernen`}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/produkt/${product.slug}`)}
                          className="mt-2 block w-full text-left group"
                        >
                          <div className="aspect-[4/3] bg-white rounded-lg overflow-hidden border border-slate-200/80">
                            <SafeImage
                              src={product.images[0]}
                              alt={product.imageAlt || product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <p className="mt-3 font-display font-bold text-base text-[#171C22] group-hover:text-[#1677FF] transition-colors">
                            {product.name}
                          </p>
                        </button>
                        <div className="mt-1 flex items-baseline gap-2 tabular-nums">
                          <span className="font-bold text-lg text-[#171C22]">
                            {formatEur(product.priceEur)}
                          </span>
                          {product.previousPriceEur && product.previousPriceEur > product.priceEur && (
                            <span className="text-xs text-slate-400 line-through">
                              {formatEur(product.previousPriceEur)}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={product.stock <= 0}
                          onClick={() =>
                            addToCart(
                              product,
                              product.colors[0] || 'Standard',
                              product.frameSizes[0] || 'M',
                              1
                            )
                          }
                          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#171C22] text-white text-xs font-semibold rounded-md hover:bg-[#1677FF] disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {product.stock > 0 ? 'In den Warenkorb' : 'Vergriffen'}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {specRows.map((row) => (
                    <tr key={row.label} className="hover:bg-slate-50/70">
                      <td className="p-4 font-medium text-slate-600 bg-[#F4F6F8]/35">
                        {row.label}
                      </td>
                      {selectedProducts.map((product) => (
                        <td
                          key={`${row.label}-${product.id}`}
                          className="p-4 border-l border-slate-200 text-[#171C22] tabular-nums"
                        >
                          {row.render(product)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="p-4 font-medium text-slate-600 bg-[#F4F6F8]/35">
                      CE / Sicherheitshinweis
                    </td>
                    {selectedProducts.map((product) => (
                      <td key={`ce-${product.id}`} className="p-4 border-l border-slate-200 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {product.ceConformity}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-slate-500 leading-relaxed">
              *Reichweitenangaben sind unverbindliche Richtwerte gemäß Musterkatalog und hängen u. a. von Unterstützungsstufe, Topografie, Gesamtgewicht, Reifendruck und Außentemperatur ab.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
