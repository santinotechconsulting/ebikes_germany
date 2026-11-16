import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  BatteryCharging,
  Bell,
  Check,
  CheckCircle2,
  Gauge,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Weight,
  ZoomIn,
  X,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { trackConversionEvent } from '../utils/analytics';
import { calcDiscountPercent, formatDateDe, formatEur } from '../utils/format';
import { applySeoMetadata } from '../utils/seo';

interface ProductDetailPageProps {
  slug: string;
}

export function ProductDetailPage({ slug }: ProductDetailPageProps) {
  const {
    products,
    reviews,
    faqs,
    settings,
    navigate,
    addToCart,
    wishlistIds,
    toggleWishlist,
    compareIds,
    toggleCompare,
    recordProductView,
    firebaseUser,
    signInWithGoogle,
    submitReview,
    submitEnquiry,
    pushToast,
  } = useStore();

  const product = useMemo(
    () => products.find((p) => p.slug === slug && p.published) || products.find((p) => p.slug === slug),
    [products, slug]
  );

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const [stockAlertEmail, setStockAlertEmail] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [detailTab, setDetailTab] = useState<'specs' | 'reviews' | 'faq'>('specs');

  useEffect(() => {
    if (!product) return;
    setActiveImageIdx(0);
    setSelectedColor(product.colors[0] || 'Standard');
    setSelectedSize(product.frameSizes[0] || 'M');
    recordProductView(product.id);
    trackConversionEvent('view_item', {
      currency: 'EUR',
      value: product.priceEur,
      items: [{ item_id: product.sku, item_name: product.name, price: product.priceEur }],
    });

    const origin = window.location.origin;
    const prodReviews = reviews.filter((r) => r.productId === product.id);
    const productSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${product.brand} ${product.name}`,
      description: product.description,
      image: product.images.map((img) => (img.startsWith('http') ? img : `${origin}${img}`)),
      sku: product.sku,
      ...(product.gtin ? { gtin13: product.gtin } : {}),
      brand: {
        '@type': 'Brand',
        name: product.brand,
      },
      offers: {
        '@type': 'Offer',
        url: `${origin}/produkt/${product.slug}`,
        priceCurrency: 'EUR',
        price: product.priceEur,
        itemCondition: 'https://schema.org/NewCondition',
        availability:
          product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
      },
    };

    if (prodReviews.length > 0) {
      const avg =
        prodReviews.reduce((s, r) => s + r.rating, 0) / prodReviews.length;
      productSchema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: avg.toFixed(1),
        reviewCount: prodReviews.length,
      };
    }

    applySeoMetadata({
      title: product.seoTitle || `${product.brand} ${product.name} | ${settings.brandName}`,
      description: product.seoDescription || product.shortDescription,
      canonicalPath: product.canonicalUrl || `/produkt/${product.slug}`,
      ogType: 'product',
      ogImage: product.ogImage || product.images[0],
      siteName: settings.brandName,
      jsonLd: [
        productSchema,
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Startseite', item: origin },
            { '@type': 'ListItem', position: 2, name: product.categoryName, item: `${origin}/kategorie/${product.categoryId}` },
            { '@type': 'ListItem', position: 3, name: product.name, item: `${origin}/produkt/${product.slug}` },
          ],
        },
      ],
    });
  }, [product, reviews, settings.brandName, recordProductView]);

  if (!product) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-[#171C22]">
          Modell nicht gefunden
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Das gewünschte E-Bike ist aktuell nicht verfügbar.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 px-5 py-2.5 bg-[#171C22] text-white text-xs font-semibold rounded-lg"
        >
          Zum E-Bike Katalog
        </button>
      </main>
    );
  }

  const productReviews = reviews.filter((r) => r.productId === product.id);
  const relatedProducts = products
    .filter((p) => p.published && p.id !== product.id && p.categoryId === product.categoryId)
    .slice(0, 3);
  const discount = calcDiscountPercent(product.priceEur, product.previousPriceEur);
  const isWishlisted = wishlistIds.includes(product.id);
  const isCompared = compareIds.includes(product.id);

  const handleStockAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAlertEmail.trim()) return;
    const res = await submitEnquiry({
      type: 'stock_alert',
      email: stockAlertEmail.trim(),
      productId: product.id,
      productName: `${product.brand} ${product.name}`,
    });
    if (res.ok) {
      setStockAlertEmail('');
      pushToast(res.message, 'success');
    } else {
      pushToast(res.message, 'error');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) return;
    setSubmittingReview(true);
    await submitReview({
      productId: product.id,
      rating: reviewRating,
      title: reviewTitle.trim(),
      comment: reviewComment.trim(),
    });
    setSubmittingReview(false);
    setReviewTitle('');
    setReviewComment('');
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mb-4">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="hover:text-[#171C22]"
        >
          Startseite
        </a>
        <span>/</span>
        <a
          href={`/kategorie/${product.categoryId}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/kategorie/${product.categoryId}`);
          }}
          className="hover:text-[#171C22]"
        >
          {product.categoryName}
        </a>
        <span>/</span>
        <span className="text-[#171C22] font-medium">{product.name}</span>
      </nav>

      {/* Contiguous Gallery + Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left: Sticky Gallery */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-3">
          <div className="relative aspect-[4/3] bg-[#F4F6F8] border border-slate-200 rounded-2xl overflow-hidden">
            <SafeImage
              src={product.images[activeImageIdx] || product.images[0]}
              alt={product.imageAlt || `${product.brand} ${product.name}`}
              loading="eager"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label="Bild vergrößern"
              className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-3 py-2 bg-white/95 border border-slate-200 rounded-lg text-xs font-semibold text-[#171C22] hover:bg-white shadow-sm"
            >
              <ZoomIn className="w-4 h-4" />
              Zoom
            </button>
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-24 aspect-[4/3] rounded-xl overflow-hidden border-2 transition-colors shrink-0 ${
                    activeImageIdx === idx ? 'border-[#1677FF]' : 'border-slate-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <SafeImage
                    src={img}
                    alt={`${product.name} Ansicht ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-xs text-slate-500">
              {product.brand} · {product.categoryName} · SKU {product.sku}
              {product.isDemoData ? ' · Musterprodukt' : ''}
            </p>
            <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-extrabold text-[#171C22]">
              {product.name}
            </h1>
            <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
              {product.shortDescription}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-mono-nums font-extrabold text-[#171C22]">
                {formatEur(product.priceEur)}
              </span>
              {product.previousPriceEur && product.previousPriceEur > product.priceEur && (
                <span className="text-base font-mono-nums text-slate-400 line-through">
                  {formatEur(product.previousPriceEur)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-xs font-mono-nums font-bold text-[#1677FF]">
                  -{discount} %
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              inkl. 19 % MwSt. ·{' '}
              {product.priceEur >= settings.freeShippingThresholdEur
                ? 'Kostenloser Speditionsversand in Deutschland'
                : `zzgl. ${formatEur(settings.standardShippingEur)} Speditionsversand`}
            </p>
          </div>

          {/* Color & Frame Size */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-[#171C22] block mb-2">
                Farbe: <span className="font-normal text-slate-600">{selectedColor}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`px-3.5 py-2 text-xs rounded-lg border transition-colors ${
                      selectedColor === c
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
              <span className="text-xs font-semibold text-[#171C22] block mb-2">
                Rahmengröße ({product.frameType})
              </span>
              <div className="flex flex-wrap gap-2">
                {product.frameSizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`px-3.5 py-2 text-xs rounded-lg border transition-colors ${
                      selectedSize === s
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

          {/* Availability & Delivery Estimate */}
          <div className="p-3.5 bg-[#F4F6F8] rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold">
              {product.stock > 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span className="text-emerald-800">
                    Auf Lager ({product.stock} Stück) · Lieferzeit ca. 3–5 Werktage in DE
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span className="text-amber-800">Derzeit vergriffen</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Truck className="w-4 h-4 text-slate-500" />
              <span>98 % fahrfertig vormontiert durch Zweirad-Spedition</span>
            </div>
          </div>

          {/* Primary Actions or Stock Alert */}
          {product.stock > 0 ? (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => addToCart(product, selectedColor, selectedSize, 1)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#171C22] text-white text-sm font-semibold rounded-xl hover:bg-[#1677FF] transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                In den Warenkorb
              </button>
              <button
                type="button"
                onClick={() => {
                  addToCart(product, selectedColor, selectedSize, 1);
                  navigate('/checkout');
                }}
                className="w-full px-5 py-3 bg-[#1677FF] text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-colors"
              >
                Sofort kaufen
              </button>
            </div>
          ) : (
            <form onSubmit={handleStockAlert} className="p-4 border border-slate-200 rounded-xl space-y-2.5">
              <p className="text-xs font-semibold text-[#171C22] flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[#1677FF]" />
                Benachrichtigung bei Verfügbarkeit erhalten
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={stockAlertEmail}
                  onChange={(e) => setStockAlertEmail(e.target.value)}
                  placeholder="ihre@email.de"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#171C22] text-white text-xs font-semibold rounded-lg"
                >
                  Merken
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-medium text-[#171C22] hover:bg-[#F4F6F8]"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} />
              {isWishlisted ? 'Auf Merkliste' : 'Merken'}
            </button>
            <button
              type="button"
              onClick={() => toggleCompare(product.id)}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-medium text-[#171C22] hover:bg-[#F4F6F8]"
            >
              {isCompared ? <Check className="w-4 h-4 text-[#1677FF]" /> : <ArrowRightLeft className="w-4 h-4" />}
              {isCompared ? 'Im Vergleich' : 'Vergleichen'}
            </button>
          </div>

          {/* Pedelec vs S-Pedelec Regulatory Notice */}
          <div className="p-4 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-[#171C22] flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-[#1677FF]" />
              {product.isSPedelec
                ? 'S-Pedelec (bis 45 km/h · Fahrzeugklasse L1e-B)'
                : 'Pedelec (bis 25 km/h · Fahrrad nach StVZO)'}
            </p>
            <p>
              {product.isSPedelec
                ? 'In Deutschland gelten Kennzeichen-, Versicherungs-, Führerschein- (mind. Klasse AM) und Helmpflicht. Radwege dürfen nur bei ausdrücklicher Freigabe befahren werden.'
                : 'Zulassungs- und führerscheinfrei in Deutschland. Radwege dürfen genutzt werden.'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Specs Strip */}
      <section className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-[#F4F6F8] border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-[#1677FF]" /> Motor & Drehmoment
          </span>
          <p className="mt-1 font-mono-nums font-bold text-sm sm:text-base text-[#171C22]">
            {product.motorTorqueNm} Nm · {product.motorPowerW} W
          </p>
          <p className="text-[11px] text-slate-600 truncate">{product.motorModel}</p>
        </div>

        <div className="p-4 bg-[#F4F6F8] border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <BatteryCharging className="w-3.5 h-3.5 text-[#1677FF]" /> Akku & Ladezeit
          </span>
          <p className="mt-1 font-mono-nums font-bold text-sm sm:text-base text-[#171C22]">
            {product.batteryWh} Wh · ca. {product.chargingTimeHours} Std.
          </p>
          <p className="text-[11px] text-slate-600">Lithium-Ionen System</p>
        </div>

        <div className="p-4 bg-[#F4F6F8] border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-[#1677FF]" /> Geschätzte Reichweite
          </span>
          <p className="mt-1 font-mono-nums font-bold text-sm sm:text-base text-[#171C22]">
            {product.rangeKmMin}–{product.rangeKmMax} km*
          </p>
          <p className="text-[11px] text-slate-600">Max. {product.maxAssistedSpeedKmh} km/h</p>
        </div>

        <div className="p-4 bg-[#F4F6F8] border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Weight className="w-3.5 h-3.5 text-[#1677FF]" /> Gewicht & Garantie
          </span>
          <p className="mt-1 font-mono-nums font-bold text-sm sm:text-base text-[#171C22]">
            {product.weightKg} kg · {product.warrantyYears} Jahre
          </p>
          <p className="text-[11px] text-slate-600">Gewährleistung ab Kauf</p>
        </div>
      </section>

      {/* Tabbed Details: Specs & Description | Customer Reviews | FAQs */}
      <section className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'specs', label: 'Beschreibung & Technische Daten' },
            { id: 'reviews', label: `Kundenbewertungen (${productReviews.length})` },
            { id: 'faq', label: 'Häufige Fragen (FAQ)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDetailTab(tab.id as 'specs' | 'reviews' | 'faq')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                detailTab === tab.id
                  ? 'bg-[#171C22] text-white border-[#171C22]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-[#171C22]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {detailTab === 'specs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold text-[#171C22]">
                  Produktbeschreibung
                </h2>
                <p className="mt-2.5 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              <div className="p-4 bg-[#F4F6F8] border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
                <p className="font-semibold text-[#171C22]">
                  Produktsicherheit, Konformität & Herstellerangaben (EU-GPSR / BattG)
                </p>
                <p>
                  <strong>CE-Konformität:</strong> {product.ceConformity}
                </p>
                <p>
                  <strong>Hersteller-Datensatz:</strong> {product.manufacturerInfo}
                </p>
                <p>
                  <strong>Sicherheitshinweis:</strong> {product.safetyNotes}
                </p>
                <p>
                  <strong>*Reichweiten-Hinweis:</strong> {product.rangeNote}
                </p>
              </div>
            </div>

            <div className="lg:col-span-6">
              <h2 className="font-display text-xl font-bold text-[#171C22] mb-3">
                Technische Spezifikationen
              </h2>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 text-xs sm:text-sm">
                {[
                  ['Antriebssystem', `${product.motorModel} (${product.motorPowerW} W / ${product.motorTorqueNm} Nm)`],
                  ['Unterstützung bis', `${product.maxAssistedSpeedKmh} km/h (${product.isSPedelec ? 'S-Pedelec' : 'Pedelec'})`],
                  ['Akkukapazität', `${product.batteryWh} Wh (Ladezeit ca. ${product.chargingTimeHours} h)`],
                  ['Rahmenmaterial & Typ', `${product.frameMaterial} · ${product.frameType}`],
                  ['Bremssystem', product.brakeSystem],
                  ['Schaltung', product.gearSystem],
                  ['Gewicht', `${product.weightKg} kg`],
                  ['Garantie / Gewährleistung', `${product.warrantyYears} Jahre gesetzliche Gewährleistung`],
                  ['Versand & Rückgabe', 'Speditionslieferung (DE) · 14 Tage Widerrufsrecht'],
                ].map(([label, val]) => (
                  <div key={label} className="grid grid-cols-12 px-4 py-2.5 bg-white">
                    <span className="col-span-5 text-slate-500">{label}</span>
                    <span className="col-span-7 font-medium text-[#171C22]">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {detailTab === 'reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              {productReviews.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Für dieses Modell liegen noch keine Bewertungen vor.
                </p>
              ) : (
                <div className="space-y-3">
                  {productReviews.map((rev) => (
                    <div key={rev.id} className="p-4 border border-slate-200 rounded-xl bg-white">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400 font-mono-nums">
                          {formatDateDe(rev.createdAt)}
                        </span>
                      </div>
                      <h3 className="mt-1.5 font-display text-sm font-bold text-[#171C22]">
                        {rev.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {rev.comment}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-500">
                        {rev.authorName}
                        {rev.isDemoData ? ' · Musterbewertung' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="p-5 bg-[#F4F6F8] border border-slate-200 rounded-xl">
                <h3 className="font-display text-base font-bold text-[#171C22]">
                  Bewertung schreiben
                </h3>
                {!firebaseUser ? (
                  <div className="mt-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Melden Sie sich mit Ihrem Kundenkonto an, um eine verifizierte Bewertung abzugeben.
                    </p>
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className="mt-3 px-4 py-2 bg-[#171C22] text-white text-xs font-semibold rounded-lg hover:bg-[#1677FF] transition-colors"
                    >
                      Mit Google anmelden
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Bewertung (1–5 Sterne)
                      </label>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} Sterne
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Überschrift</label>
                      <input
                        type="text"
                        required
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="Kurzes Fazit"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Kommentar</label>
                      <textarea
                        required
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Wie fährt sich das E-Bike im Alltag?"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full py-2.5 bg-[#1677FF] text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {submittingReview ? 'Wird gespeichert...' : 'Bewertung veröffentlichen'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {detailTab === 'faq' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.slice(0, 4).map((faq) => (
              <div key={faq.id} className="p-4 bg-[#F4F6F8] border border-slate-200 rounded-xl">
                <h3 className="font-display text-sm font-bold text-[#171C22]">{faq.question}</h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-10 pt-8 border-t border-slate-200">
          <h2 className="font-display text-xl font-bold text-[#171C22] mb-5">
            Ähnliche E-Bikes in {product.categoryName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Image Zoom Lightbox */}
      {zoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Zoom schließen"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white text-[#171C22] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-5xl w-full bg-white rounded-2xl overflow-hidden">
            <SafeImage
              src={product.images[activeImageIdx] || product.images[0]}
              alt={product.name}
              className="w-full max-h-[82vh] object-contain bg-[#F4F6F8]"
            />
          </div>
        </div>
      )}
    </main>
  );
}
