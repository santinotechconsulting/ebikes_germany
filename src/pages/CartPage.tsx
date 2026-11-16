import { useEffect, useState } from 'react';
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Tag, Trash2, Truck } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { formatEur } from '../utils/format';
import { applySeoMetadata } from '../utils/seo';

export function CartPage() {
  const {
    cart,
    updateCartQty,
    removeFromCart,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTotal,
    settings,
    navigate,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    applySeoMetadata({
      title: `Warenkorb | ${settings.brandName}`,
      description: 'Überprüfen Sie Ihre ausgewählten E-Bikes, Gutscheincodes und Versandkosten.',
      canonicalPath: '/warenkorb',
      noindex: true,
      siteName: settings.brandName,
    });
  }, [settings.brandName]);

  const handleCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await applyCouponCode(couponInput);
    setCouponFeedback({ ok: res.ok, text: res.message });
    if (res.ok) setCouponInput('');
  };

  const vatAmount = cartTotal - cartTotal / 1.19;
  const remainingForFreeShipping = Math.max(
    0,
    settings.freeShippingThresholdEur - (cartSubtotal - cartDiscount)
  );

  return (
    <main className="bg-[#F4F6F8] min-h-[75vh] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#171C22]">
          Ihr Warenkorb
        </h1>

        {cart.length === 0 ? (
          <div className="mt-8 bg-white border border-slate-200 rounded-xl p-10 text-center max-w-xl mx-auto">
            <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
            <h2 className="mt-4 font-display text-xl font-bold text-[#171C22]">
              Ihr Warenkorb ist derzeit leer
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Entdecken Sie unsere fahrfertig vormontierten E-Bikes mit Speditionsversand in ganz Deutschland.
            </p>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="mt-6 px-6 py-3 bg-[#171C22] text-white text-sm font-semibold rounded-md hover:bg-[#1677FF] transition-colors"
            >
              E-Bikes entdecken
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              {remainingForFreeShipping > 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-3 text-sm text-slate-700">
                  <Truck className="w-4 h-4 text-[#1677FF] shrink-0" />
                  <span>
                    Noch <strong className="tabular-nums">{formatEur(remainingForFreeShipping)}</strong> bis zum kostenlosen Speditionsversand innerhalb Deutschlands.
                  </span>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-3 text-sm text-emerald-800">
                  <Truck className="w-4 h-4 shrink-0" />
                  <span>Ihr Speditionsversand innerhalb Deutschlands ist kostenlos.</span>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
                {cart.map((item) => (
                  <div
                    key={`${item.productId}-${item.color}-${item.frameSize}`}
                    className="p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/produkt/${item.slug}`)}
                      className="w-28 h-22 bg-[#F4F6F8] rounded-lg overflow-hidden shrink-0 border border-slate-200"
                    >
                      <SafeImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {item.brand} · SKU {item.sku}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(`/produkt/${item.slug}`)}
                        className="mt-0.5 font-display text-lg font-bold text-[#171C22] hover:text-[#1677FF] text-left"
                      >
                        {item.name}
                      </button>
                      <p className="mt-1 text-xs text-slate-600">
                        Farbe: <span className="font-medium text-[#171C22]">{item.color}</span> · Rahmengröße:{' '}
                        <span className="font-medium text-[#171C22]">{item.frameSize}</span>
                      </p>
                      {item.isSPedelec && (
                        <p className="mt-1 text-xs text-amber-700 font-medium">
                          S-Pedelec (45 km/h): Kennzeichen-, Helm- und Fahrerlaubnispflicht (AM) in Deutschland.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="inline-flex items-center border border-slate-200 rounded-md">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQty(item.productId, item.color, item.frameSize, item.quantity - 1)
                          }
                          aria-label="Menge verringern"
                          className="p-2 text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-sm font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQty(item.productId, item.color, item.frameSize, item.quantity + 1)
                          }
                          aria-label="Menge erhöhen"
                          className="p-2 text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[100px] tabular-nums">
                        <p className="font-bold text-[#171C22]">
                          {formatEur(item.priceEur * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-slate-500">
                            {formatEur(item.priceEur)} / Stk.
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.productId, item.color, item.frameSize)
                        }
                        aria-label="Artikel entfernen"
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5 sticky top-24">
              <h2 className="font-display text-lg font-bold text-[#171C22]">
                Bestellübersicht
              </h2>

              <form onSubmit={handleCoupon} className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Gutscheincode (z. B. WILLKOMMEN100 oder PENDLER10)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Code eingeben"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#1677FF]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-[#1677FF] transition-colors whitespace-nowrap shrink-0"
                  >
                    Einlösen
                  </button>
                </div>
                {couponFeedback && (
                  <p className={`text-xs ${couponFeedback.ok ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {couponFeedback.text}
                  </p>
                )}
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 px-3 py-2 rounded-md">
                    <span>
                      Aktiv: <strong>{appliedCoupon.code}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="underline hover:text-rose-700"
                    >
                      Entfernen
                    </button>
                  </div>
                )}
              </form>

              <div className="border-t border-slate-200 pt-4 space-y-2.5 text-sm tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span>Zwischensumme</span>
                  <span>{formatEur(cartSubtotal)}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Rabatt ({appliedCoupon?.code})</span>
                    <span>−{formatEur(cartDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Speditionsversand (DE)</span>
                  <span>{cartShipping === 0 ? 'Kostenlos' : formatEur(cartShipping)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-base text-[#171C22]">Gesamtbetrag</span>
                  <span className="font-display font-bold text-2xl text-[#171C22]">
                    {formatEur(cartTotal)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 text-right">
                  inkl. 19 % gesetzl. MwSt. ({formatEur(vatAmount)})
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 bg-[#1677FF] text-white font-semibold text-sm rounded-md hover:bg-[#1262d4] transition-colors"
              >
                Zur sicheren Kasse
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>14 Tage gesetzliches Widerrufsrecht · Zahlungsverifizierung über Server-Endpunkt</span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
