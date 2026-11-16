import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { IMG_WORKSHOP } from '../data/seedData';
import { formatEur } from '../utils/format';
import { applySeoMetadata } from '../utils/seo';

export function HomePage() {
  const {
    settings,
    categories,
    brands,
    products,
    testimonials,
    blogPosts,
    faqs,
    recentProductIds,
    navigate,
    t,
  } = useStore();

  const [showcaseTab, setShowcaseTab] = useState<'featured' | 'new' | 'offers' | 'recent'>('featured');
  const [showAllShowcase, setShowAllShowcase] = useState(false);
  const [infoTab, setInfoTab] = useState<'quality' | 'proof' | 'faq'>('quality');
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqs[0]?.id || null);

  useEffect(() => {
    const origin = window.location.origin;
    applySeoMetadata({
      title: `${settings.brandName} – ${settings.tagline}`,
      description:
        'Hochwertige E-Bikes online kaufen in Deutschland: City, Trekking, E-MTB, Cargo und SUV Elektrofahrräder mit Fachberatung und Speditionsversand.',
      canonicalPath: '/',
      ogType: 'website',
      ogImage: settings.heroBannerImage,
      siteName: settings.brandName,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: settings.brandName,
          url: origin,
          email: settings.contactEmail,
          telephone: settings.contactPhone,
          address: {
            '@type': 'PostalAddress',
            streetAddress: settings.streetAddress,
            postalCode: settings.postalCode,
            addressLocality: settings.city,
            addressCountry: 'DE',
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: settings.brandName,
          url: origin,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${origin}/shop?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    });
  }, [settings]);

  const publishedProducts = useMemo(() => products.filter((p) => p.published), [products]);

  const recentProducts = useMemo(
    () =>
      recentProductIds
        .map((id) => publishedProducts.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .slice(0, 6),
    [recentProductIds, publishedProducts]
  );

  const showcaseProducts = useMemo(() => {
    let list = publishedProducts;
    if (showcaseTab === 'featured') {
      list = publishedProducts.filter((p) => p.featured);
    } else if (showcaseTab === 'new') {
      list = publishedProducts.filter((p) => p.isNewArrival);
    } else if (showcaseTab === 'offers') {
      list = publishedProducts.filter(
        (p) => p.isSpecialOffer || (p.previousPriceEur && p.previousPriceEur > p.priceEur)
      );
    } else if (showcaseTab === 'recent') {
      list = recentProducts;
    }
    return showAllShowcase ? list.slice(0, 6) : list.slice(0, 3);
  }, [publishedProducts, recentProducts, showcaseTab, showAllShowcase]);

  return (
    <main>
      {/* 1. Compact Architectural Hero */}
      <section className="relative bg-[#171C22] text-white overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage
            src={settings.heroBannerImage}
            alt="Modernes E-Bike vor bayerischem Alpenpanorama bei Sonnenuntergang"
            loading="eager"
            className="w-full h-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171C22]/90 via-[#171C22]/70 to-[#171C22]/30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wider uppercase text-slate-300">
              {settings.brandName} · Deutschland · {t('demoNotice')}
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
              {settings.heroHeadline}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl">
              {settings.heroSubtitle}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1677FF] text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t('heroCtaPrimary')}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowcaseTab('featured');
                  document.getElementById('featured-showcase')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/25 text-white text-sm font-semibold rounded-lg hover:bg-white/20 transition-colors"
              >
                {t('heroCtaSecondary')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/kaufberater')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-slate-200 hover:text-white text-sm font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#1677FF]" />
                Kaufberater
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-white/15 grid grid-cols-3 gap-4 text-xs text-slate-300">
              <div>
                <span className="font-semibold text-white block">98 % vormontiert</span>
                <span>Fahrfertig per Spedition</span>
              </div>
              <div>
                <span className="font-semibold text-white block">
                  Ab {formatEur(settings.freeShippingThresholdEur)} frei
                </span>
                <span>Versand in Deutschland</span>
              </div>
              <div>
                <span className="font-semibold text-white block">2 Jahre Gewährleistung</span>
                <span>14 Tage Widerruf</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Compact Single-Row Category Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-display text-lg sm:text-xl font-bold text-[#171C22]">
            Kategorien entdecken
          </h2>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="text-xs font-semibold text-[#1677FF] hover:text-[#171C22] whitespace-nowrap"
          >
            Alle Modelle →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`/kategorie/${cat.slug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/kategorie/${cat.slug}`);
              }}
              className="group bg-[#F4F6F8] border border-slate-200 rounded-xl overflow-hidden hover:border-[#1677FF] transition-colors"
            >
              <div className="aspect-[16/10] bg-white overflow-hidden">
                <SafeImage
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
              <div className="px-3 py-2.5 flex items-center justify-between gap-1">
                <h3 className="font-display text-xs sm:text-sm font-bold text-[#171C22] truncate">
                  {cat.name}
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1677FF] shrink-0" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 3. Tabbed Model Showcase (3-Card Compact Row by Default) */}
      <section id="featured-showcase" className="bg-[#F4F6F8] border-y border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#171C22]">
                Ausgewählte Modelle im Überblick
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Alle Preise in EUR inkl. 19 % gesetzl. MwSt. (Demo-Produktdaten)
              </p>
            </div>

            <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl self-start overflow-x-auto max-w-full">
              {[
                { key: 'featured', label: 'Bestseller' },
                { key: 'new', label: 'Neuheiten' },
                { key: 'offers', label: 'Angebote' },
                ...(recentProducts.length > 0
                  ? [{ key: 'recent', label: `Zuletzt (${recentProducts.length})` }]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setShowcaseTab(tab.key as 'featured' | 'new' | 'offers' | 'recent')
                  }
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    showcaseTab === tab.key
                      ? 'bg-[#171C22] text-white'
                      : 'text-slate-600 hover:text-[#171C22]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {showcaseProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowAllShowcase((v) => !v)}
              className="px-4 py-2 bg-white border border-slate-300 text-xs font-semibold text-[#171C22] rounded-lg hover:border-[#171C22] transition-colors"
            >
              {showAllShowcase ? 'Weniger anzeigen' : 'Mehr in dieser Auswahl zeigen'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#171C22] text-white text-xs font-semibold rounded-lg hover:bg-[#1677FF] transition-colors"
            >
              Alle {publishedProducts.length} E-Bikes im Katalog
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Consolidated Tabbed Trust, Reviews, Knowledge & FAQ Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#171C22]">
            Qualität, Beratung & Wissenszentrum
          </h2>
          <div className="inline-flex p-1 bg-[#F4F6F8] border border-slate-200 rounded-xl self-start overflow-x-auto max-w-full">
            {[
              { id: 'quality', label: 'Qualität & Marken' },
              { id: 'proof', label: 'Stimmen & Ratgeber' },
              { id: 'faq', label: 'Kaufinfo & FAQ' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInfoTab(tab.id as 'quality' | 'proof' | 'faq')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  infoTab === tab.id
                    ? 'bg-white text-[#171C22] shadow-sm'
                    : 'text-slate-600 hover:text-[#171C22]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {infoTab === 'quality' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: Truck,
                    title: 'Speditionsversand in DE',
                    desc: 'Sicher verpackt und zu 98 % fahrfertig vormontiert direkt zu Ihnen nach Hause.',
                  },
                  {
                    icon: CreditCard,
                    title: 'Flexible Bezahlung',
                    desc: 'Kreditkarte, PayPal, Klarna, SEPA-Lastschrift und Vorkasse.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Sichere Datenverarbeitung',
                    desc: 'DSGVO-konformer Bestellprozess ohne Speicherung sensibler Kartendaten.',
                  },
                  {
                    icon: Award,
                    title: 'Marken-Antriebe',
                    desc: 'Systeme von Bosch, Shimano STEPS, Fazua und Mahle.',
                  },
                ].map((feat) => (
                  <div
                    key={feat.title}
                    className="p-4 bg-[#F4F6F8] border border-slate-200 rounded-xl space-y-1"
                  >
                    <div className="flex items-center gap-2 text-sm font-bold text-[#171C22]">
                      <feat.icon className="w-4 h-4 text-[#1677FF]" />
                      <span>{feat.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-xl overflow-hidden border border-slate-200 aspect-[16/10] bg-[#F4F6F8]">
                  <SafeImage
                    src={IMG_WORKSHOP}
                    alt="Moderne deutsche E-Bike Werkstatt und Kalibrierung"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => navigate(`/shop?brand=${encodeURIComponent(brand.name)}`)}
                  className="py-3 px-3 bg-[#F4F6F8] border border-slate-200 rounded-xl text-center hover:border-[#1677FF] transition-colors"
                >
                  <span className="font-display text-sm font-bold text-[#171C22] block">
                    {brand.name}
                  </span>
                  <span className="text-[11px] text-slate-500">{brand.country}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {infoTab === 'proof' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {testimonials.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="bg-[#F4F6F8] border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 mb-2">
                      {Array.from({ length: item.rating }).map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">„{item.quote}“</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/70">
                    <p className="text-xs font-bold text-[#171C22]">{item.authorName}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.city} · {item.bikeModel}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {blogPosts
                .filter((p) => p.published)
                .slice(0, 3)
                .map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => navigate(`/ratgeber/${post.slug}`)}
                    className="text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-[#1677FF] transition-colors"
                  >
                    <p className="text-[11px] text-[#1677FF] font-semibold">
                      {post.category} · {post.readingMinutes} Min.
                    </p>
                    <h3 className="mt-1 font-display text-sm font-bold text-[#171C22] line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">{post.excerpt}</p>
                  </button>
                ))}
            </div>
          </div>
        )}

        {infoTab === 'faq' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <h3 className="font-display text-lg font-bold text-[#171C22]">
                E-Bike online kaufen in Deutschland
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Alle regulären Pedelecs bis 25 km/h erfüllen die Norm EN 15194 und die StVZO-Vorgaben. Für weite Pendelstrecken bieten S-Pedelecs Unterstützung bis 45 km/h.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Transparente EUR-Endpreise inkl. 19 % gesetzl. MwSt.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Vergleichsfunktion für bis zu 4 Modelle nebeneinander</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>PDF-Rechnung mit ausgewiesener deutscher Umsatzsteuer</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7 divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
              {faqs.slice(0, 5).map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div key={faq.id} className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className="w-full flex items-center justify-between gap-4 text-left"
                    >
                      <span className="font-display text-xs sm:text-sm font-semibold text-[#171C22]">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
