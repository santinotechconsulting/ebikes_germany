import React, { useState } from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatEur } from '../utils/format';
import { SafeImage } from './SafeImage';

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
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
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!isCartOpen) return null;

  const remainingForFreeShipping = Math.max(
    0,
    settings.freeShippingThresholdEur - (cartSubtotal - cartDiscount)
  );

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await applyCouponCode(couponInput);
    setCouponMsg({ ok: res.ok, text: res.message });
    if (res.ok) setCouponInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/45 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      <aside
        aria-label="Warenkorb"
        className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#171C22]" />
            <h2 className="font-display text-lg font-bold text-[#171C22]">Warenkorb</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Warenkorb schließen"
            className="p-2 text-slate-500 hover:text-[#171C22] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.length > 0 && (
          <div className="px-6 py-2.5 bg-[#F4F6F8] border-b border-slate-200 text-xs text-slate-700">
            {remainingForFreeShipping === 0 ? (
              <span className="font-medium text-emerald-700">
                Kostenloser Speditionsversand innerhalb Deutschlands aktiviert.
              </span>
            ) : (
              <span>
                Noch <strong className="font-mono-nums">{formatEur(remainingForFreeShipping)}</strong> bis zum kostenlosen Speditionsversand.
              </span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-[#171C22]">Ihr Warenkorb ist noch leer.</p>
              <p className="mt-1 text-xs text-slate-500">
                Entdecken Sie unsere City-, Trekking-, E-MTB- und Cargo-Modelle.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/shop');
                }}
                className="mt-5 px-5 py-2.5 bg-[#171C22] text-white text-xs font-semibold rounded-lg hover:bg-[#1677FF] transition-colors"
              >
                E-Bikes entdecken
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.productId}-${item.color}-${item.frameSize}`}
                className="py-4 flex gap-4"
              >
                <SafeImage
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-16 object-cover rounded-lg bg-[#F4F6F8] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500">{item.brand}</p>
                      <a
                        href={`/produkt/${item.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setIsCartOpen(false);
                          navigate(`/produkt/${item.slug}`);
                        }}
                        className="text-sm font-semibold text-[#171C22] hover:text-[#1677FF] line-clamp-1"
                      >
                        {item.name}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.color, item.frameSize)}
                      aria-label="Artikel entfernen"
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.color} · {item.frameSize}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center border border-slate-200 rounded-lg">
                      <button
                        type="button"
                        aria-label="Menge verringern"
                        onClick={() =>
                          updateCartQty(
                            item.productId,
                            item.color,
                            item.frameSize,
                            item.quantity - 1
                          )
                        }
                        className="p-1.5 text-slate-600 hover:text-[#171C22]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-mono-nums font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Menge erhöhen"
                        onClick={() =>
                          updateCartQty(
                            item.productId,
                            item.color,
                            item.frameSize,
                            item.quantity + 1
                          )
                        }
                        className="p-1.5 text-slate-600 hover:text-[#171C22]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-sm font-mono-nums font-bold text-[#171C22]">
                      {formatEur(item.priceEur * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-[#F4F6F8] space-y-4">
            {/* Coupon Input */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Gutscheincode (z. B. WILLKOMMEN100)"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1677FF]"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 text-[#171C22] rounded-lg hover:bg-slate-100"
              >
                Einlösen
              </button>
            </form>

            {couponMsg && (
              <p className={`text-xs ${couponMsg.ok ? 'text-emerald-700' : 'text-red-600'}`}>
                {couponMsg.text}
              </p>
            )}

            {appliedCoupon && (
              <div className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-lg border border-slate-200">
                <span className="font-medium text-emerald-700">
                  Code aktiv: {appliedCoupon.code}
                </span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-slate-500 hover:text-red-600"
                >
                  Entfernen
                </button>
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Zwischensumme</span>
                <span className="font-mono-nums">{formatEur(cartSubtotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Rabatt ({appliedCoupon?.code})</span>
                  <span className="font-mono-nums">-{formatEur(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Speditionsversand (DE)</span>
                <span className="font-mono-nums">
                  {cartShipping === 0 ? 'Kostenlos' : formatEur(cartShipping)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-[#171C22]">
                <span>Gesamtsumme (inkl. 19 % MwSt.)</span>
                <span className="font-mono-nums text-base">{formatEur(cartTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/warenkorb');
                }}
                className="px-4 py-3 text-xs font-semibold border border-slate-300 bg-white text-[#171C22] rounded-lg hover:bg-slate-100 transition-colors"
              >
                Warenkorb ansehen
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/checkout');
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold bg-[#1677FF] text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Zur Kasse
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
