import { ArrowRightLeft, Check, Eye, Heart, ShoppingBag, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types/store';
import { calcDiscountPercent, formatEur } from '../utils/format';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const {
    navigate,
    addToCart,
    wishlistIds,
    toggleWishlist,
    compareIds,
    toggleCompare,
    setQuickViewProduct,
    t,
  } = useStore();

  const discount = calcDiscountPercent(product.priceEur, product.previousPriceEur);
  const isWishlisted = wishlistIds.includes(product.id);
  const isCompared = compareIds.includes(product.id);

  return (
    <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <div className="relative aspect-[16/10] bg-[#F4F6F8] overflow-hidden">
          <a
            href={`/produkt/${product.slug}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/produkt/${product.slug}`);
            }}
            className="block w-full h-full"
          >
            <SafeImage
              src={product.images[0]}
              alt={product.imageAlt || `${product.brand} ${product.name}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </a>

          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label={isWishlisted ? 'Von Wunschliste entfernen' : 'Auf Wunschliste speichern'}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                isWishlisted
                  ? 'bg-[#171C22] text-white border-[#171C22]'
                  : 'bg-white/95 text-slate-700 border-slate-200 hover:text-[#1677FF]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => toggleCompare(product.id)}
              aria-label="Modell vergleichen"
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                isCompared
                  ? 'bg-[#1677FF] text-white border-[#1677FF]'
                  : 'bg-white/95 text-slate-700 border-slate-200 hover:text-[#1677FF]'
              }`}
            >
              {isCompared ? <Check className="w-3.5 h-3.5" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setQuickViewProduct(product)}
              aria-label={t('quickView')}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/95 text-slate-700 border border-slate-200 hover:text-[#1677FF] transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="truncate">
              {product.brand} · {product.categoryName}
              {product.isSPedelec ? ' · 45 km/h' : ''}
            </span>
            {product.reviewCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[#171C22] font-medium shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-mono-nums">{product.ratingAvg.toFixed(1)}</span>
              </span>
            )}
          </div>

          <h3 className="mt-1 font-display text-sm sm:text-base font-semibold text-[#171C22] leading-snug truncate">
            <a
              href={`/produkt/${product.slug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/produkt/${product.slug}`);
              }}
              className="hover:text-[#1677FF] transition-colors"
            >
              {product.name}
            </a>
          </h3>

          <p className="mt-1 text-xs text-slate-600 font-mono-nums truncate">
            {product.motorBrand} {product.motorTorqueNm} Nm · {product.batteryWh} Wh · {product.rangeKmMin}–{product.rangeKmMax} km
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-slate-100">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-mono-nums font-bold text-[#171C22]">
              {formatEur(product.priceEur)}
            </span>
            {product.previousPriceEur && product.previousPriceEur > product.priceEur && (
              <span className="text-xs font-mono-nums text-slate-400 line-through">
                {formatEur(product.previousPriceEur)}
              </span>
            )}
            {discount > 0 && (
              <span className="text-xs font-mono-nums font-semibold text-[#1677FF]">
                -{discount} %
              </span>
            )}
          </div>

          <span
            className={`text-xs font-medium ${
              product.stock > 3
                ? 'text-emerald-700'
                : product.stock > 0
                  ? 'text-amber-700'
                  : 'text-red-700'
            }`}
          >
            {product.stock > 3
              ? t('inStock')
              : product.stock > 0
                ? `${product.stock} auf Lager`
                : t('outOfStock')}
          </span>
        </div>

        <div className="mt-2.5 flex gap-2">
          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() =>
              addToCart(product, product.colors[0] || 'Standard', product.frameSizes[0] || 'M', 1)
            }
            className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#171C22] text-white hover:bg-[#1677FF] disabled:bg-slate-200 disabled:text-slate-500 transition-colors whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {product.stock > 0 ? t('addToCart') : t('outOfStock')}
          </button>
        </div>
      </div>
    </article>
  );
}
