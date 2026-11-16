import { useState } from 'react';
import { ArrowRight, BatteryCharging, Gauge, ShoppingBag, Weight, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatEur } from '../utils/format';
import { SafeImage } from './SafeImage';

export function QuickViewModal() {
  const { quickViewProduct, setQuickViewProduct, addToCart, navigate } = useStore();
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');

  if (!quickViewProduct) return null;

  const activeColor = selectedColor || quickViewProduct.colors[0] || 'Standard';
  const activeSize = selectedSize || quickViewProduct.frameSizes[0] || 'M';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setQuickViewProduct(null)}
      />
      <div className="relative bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setQuickViewProduct(null)}
          aria-label="Schnellansicht schließen"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-lg bg-white/90 border border-slate-200 flex items-center justify-center text-slate-700 hover:text-[#171C22]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-[#F4F6F8] aspect-[4/3] md:aspect-auto flex items-center justify-center">
          <SafeImage
            src={quickViewProduct.images[0]}
            alt={quickViewProduct.imageAlt || quickViewProduct.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-500">
              {quickViewProduct.brand} · {quickViewProduct.categoryName}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-[#171C22]">
              {quickViewProduct.name}
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {quickViewProduct.shortDescription}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5" /> Antrieb
                </span>
                <span className="font-mono-nums font-semibold text-[#171C22] mt-0.5 block">
                  {quickViewProduct.motorTorqueNm} Nm
                </span>
              </div>
              <div>
                <span className="text-slate-400 flex items-center gap-1">
                  <BatteryCharging className="w-3.5 h-3.5" /> Akku
                </span>
                <span className="font-mono-nums font-semibold text-[#171C22] mt-0.5 block">
                  {quickViewProduct.batteryWh} Wh
                </span>
              </div>
              <div>
                <span className="text-slate-400 flex items-center gap-1">
                  <Weight className="w-3.5 h-3.5" /> Gewicht
                </span>
                <span className="font-mono-nums font-semibold text-[#171C22] mt-0.5 block">
                  {quickViewProduct.weightKg} kg
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs font-medium text-slate-700 block mb-1.5">Farbe</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickViewProduct.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        activeColor === c
                          ? 'border-[#1677FF] bg-[#1677FF]/10 text-[#1677FF] font-semibold'
                          : 'border-slate-200 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-700 block mb-1.5">Rahmengröße</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickViewProduct.frameSizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        activeSize === s
                          ? 'border-[#171C22] bg-[#171C22] text-white font-semibold'
                          : 'border-slate-200 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-2xl font-mono-nums font-bold text-[#171C22]">
                {formatEur(quickViewProduct.priceEur)}
              </span>
              <span className="text-xs text-slate-500">inkl. 19 % MwSt.</span>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={quickViewProduct.stock <= 0}
                onClick={() => {
                  addToCart(quickViewProduct, activeColor, activeSize, 1);
                  setQuickViewProduct(null);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#171C22] text-white text-xs font-semibold rounded-lg hover:bg-[#1677FF] disabled:bg-slate-200 disabled:text-slate-500 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                {quickViewProduct.stock > 0 ? 'In den Warenkorb' : 'Derzeit vergriffen'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const slug = quickViewProduct.slug;
                  setQuickViewProduct(null);
                  navigate(`/produkt/${slug}`);
                }}
                className="inline-flex items-center gap-1 px-4 py-3 border border-slate-300 text-xs font-semibold text-[#171C22] rounded-lg hover:bg-[#F4F6F8] transition-colors"
              >
                Details
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
