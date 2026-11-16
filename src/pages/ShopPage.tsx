import { useEffect, useMemo, useState } from 'react';
import { Filter, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { formatEur } from '../utils/format';
import { applySeoMetadata } from '../utils/seo';

interface ShopPageProps {
  categorySlug?: string;
}

export function ShopPage({ categorySlug }: ShopPageProps) {
  const { products, categories, brands, settings, navigate } = useStore();

  const initialQuery = new URLSearchParams(window.location.search).get('q') || '';
  const initialBrand = new URLSearchParams(window.location.search).get('brand') || '';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(categorySlug || 'all');
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand || 'all');
  const [maxPrice, setMaxPrice] = useState<number>(8500);
  const [minBatteryWh, setMinBatteryWh] = useState<number>(0);
  const [motorBrand, setMotorBrand] = useState<string>('all');
  const [minMotorPower, setMinMotorPower] = useState<number>(0);
  const [speedClass, setSpeedClass] = useState<'all' | '25' | '45'>('all');
  const [frameSize, setFrameSize] = useState<string>('all');
  const [frameType, setFrameType] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc' | 'newest' | 'rating'>('popular');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    setSelectedCategory(categorySlug || 'all');
    setPage(1);
  }, [categorySlug]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory),
    [categories, selectedCategory]
  );

  useEffect(() => {
    const origin = window.location.origin;
    if (activeCategory) {
      applySeoMetadata({
        title: activeCategory.seoTitle || `${activeCategory.name} kaufen | ${settings.brandName}`,
        description: activeCategory.seoDescription || activeCategory.description,
        canonicalPath: `/kategorie/${activeCategory.slug}`,
        ogImage: activeCategory.image,
        siteName: settings.brandName,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Startseite', item: origin },
            { '@type': 'ListItem', position: 2, name: 'E-Bikes', item: `${origin}/shop` },
            {
              '@type': 'ListItem',
              position: 3,
              name: activeCategory.name,
              item: `${origin}/kategorie/${activeCategory.slug}`,
            },
          ],
        },
      });
    } else {
      applySeoMetadata({
        title: `E-Bike Shop Deutschland – Alle Modelle entdecken | ${settings.brandName}`,
        description:
          'Alle E-Bikes im Überblick: Filtern Sie nach Kategorie, Marke, Bosch & Shimano Motor, Akku-Kapazität, Rahmenform und Preis.',
        canonicalPath: '/shop',
        siteName: settings.brandName,
      });
    }
  }, [activeCategory, settings.brandName]);

  const publishedProducts = useMemo(() => products.filter((p) => p.published), [products]);

  const availableColors = useMemo(
    () => Array.from(new Set(publishedProducts.flatMap((p) => p.colors))).sort(),
    [publishedProducts]
  );

  const availableSizes = useMemo(
    () => Array.from(new Set(publishedProducts.flatMap((p) => p.frameSizes))).sort(),
    [publishedProducts]
  );

  const availableMotorBrands = useMemo(
    () => Array.from(new Set(publishedProducts.map((p) => p.motorBrand))).sort(),
    [publishedProducts]
  );

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = publishedProducts.filter((p) => {
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.brand.toLowerCase().includes(q) &&
        !p.categoryName.toLowerCase().includes(q) &&
        !p.motorModel.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
      if (p.priceEur > maxPrice) return false;
      if (p.batteryWh < minBatteryWh) return false;
      if (motorBrand !== 'all' && p.motorBrand !== motorBrand) return false;
      if (p.motorPowerW < minMotorPower) return false;
      if (speedClass === '25' && p.maxAssistedSpeedKmh !== 25) return false;
      if (speedClass === '45' && p.maxAssistedSpeedKmh !== 45) return false;
      if (frameSize !== 'all' && !p.frameSizes.includes(frameSize)) return false;
      if (frameType !== 'all' && p.frameType !== frameType) return false;
      if (colorFilter !== 'all' && !p.colors.includes(colorFilter)) return false;
      if (onlyInStock && p.stock <= 0) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return a.priceEur - b.priceEur;
      if (sortBy === 'price_desc') return b.priceEur - a.priceEur;
      if (sortBy === 'newest') return Number(b.isNewArrival) - Number(a.isNewArrival);
      if (sortBy === 'rating') return b.ratingAvg - a.ratingAvg;
      return Number(b.featured) - Number(a.featured) || b.ratingAvg - a.ratingAvg;
    });
  }, [
    publishedProducts,
    searchTerm,
    selectedCategory,
    selectedBrand,
    maxPrice,
    minBatteryWh,
    motorBrand,
    minMotorPower,
    speedClass,
    frameSize,
    frameType,
    colorFilter,
    onlyInStock,
    sortBy,
  ]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    if (page > maxPage) setPage(1);
  }, [filteredProducts.length, page]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setMaxPrice(8500);
    setMinBatteryWh(0);
    setMotorBrand('all');
    setMinMotorPower(0);
    setSpeedClass('all');
    setFrameSize('all');
    setFrameType('all');
    setColorFilter('all');
    setOnlyInStock(false);
    setPage(1);
    if (categorySlug) navigate('/shop');
  };

  const FilterPanel = (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
        <span className="font-display font-bold text-[#171C22] flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </span>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#1677FF] hover:underline"
        >
          <RotateCcw className="w-3 h-3" />
          Zurücksetzen
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Suche</label>
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Modell, Motor, Marke..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1677FF]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategorie</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
        >
          <option value="all">Alle Kategorien</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hersteller</label>
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
        >
          <option value="all">Alle Marken</option>
          {brands.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
          <span>Max. Preis</span>
          <span className="font-mono-nums">{formatEur(maxPrice)}</span>
        </div>
        <input
          type="range"
          min={2000}
          max={8500}
          step={250}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#1677FF]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Min. Akkukapazität
        </label>
        <select
          value={minBatteryWh}
          onChange={(e) => setMinBatteryWh(Number(e.target.value))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
        >
          <option value={0}>Alle Akkus</option>
          <option value={400}>Ab 400 Wh</option>
          <option value={500}>Ab 500 Wh</option>
          <option value={625}>Ab 625 Wh</option>
          <option value={750}>Ab 750 Wh</option>
          <option value={1000}>DualBattery (1.000+ Wh)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Motormarke</label>
          <select
            value={motorBrand}
            onChange={(e) => setMotorBrand(e.target.value)}
            className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white"
          >
            <option value="all">Alle</option>
            {availableMotorBrands.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Motorleistung</label>
          <select
            value={minMotorPower}
            onChange={(e) => setMinMotorPower(Number(e.target.value))}
            className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white"
          >
            <option value={0}>Alle</option>
            <option value={250}>Ab 250 W</option>
            <option value={350}>350 W (S-Pedelec)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Unterstützung / Klasse
        </label>
        <select
          value={speedClass}
          onChange={(e) => setSpeedClass(e.target.value as 'all' | '25' | '45')}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
        >
          <option value="all">Alle (Pedelec & S-Pedelec)</option>
          <option value="25">Pedelec bis 25 km/h (Fahrrad)</option>
          <option value="45">S-Pedelec bis 45 km/h (L1e-B)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rahmenform</label>
          <select
            value={frameType}
            onChange={(e) => setFrameType(e.target.value)}
            className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white"
          >
            <option value="all">Alle</option>
            {['Diamant', 'Trapez', 'Tiefeinsteiger', 'Fully', 'Kompakt', 'Cargo'].map((ft) => (
              <option key={ft} value={ft}>
                {ft}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rahmengröße</label>
          <select
            value={frameSize}
            onChange={(e) => setFrameSize(e.target.value)}
            className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white"
          >
            <option value="all">Alle</option>
            {availableSizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Farbe</label>
        <select
          value={colorFilter}
          onChange={(e) => setColorFilter(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
        >
          <option value="all">Alle Farben</option>
          {availableColors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2.5 pt-2 cursor-pointer text-xs font-medium text-[#171C22]">
        <input
          type="checkbox"
          checked={onlyInStock}
          onChange={(e) => setOnlyInStock(e.target.checked)}
          className="accent-[#1677FF] w-4 h-4"
        />
        <span>Nur sofort lieferbare Modelle</span>
      </label>
    </div>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 flex items-center gap-2 mb-4">
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
          href="/shop"
          onClick={(e) => {
            e.preventDefault();
            navigate('/shop');
          }}
          className="hover:text-[#171C22]"
        >
          E-Bikes
        </a>
        {activeCategory && (
          <>
            <span>/</span>
            <span className="text-[#171C22] font-medium">{activeCategory.name}</span>
          </>
        )}
      </nav>

      {/* Header */}
      <div className="pb-5 border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#171C22]">
            {activeCategory ? activeCategory.name : 'Alle E-Bikes im Katalog'}
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            {activeCategory
              ? activeCategory.description
              : 'Vergleichen und filtern Sie hochwertige City-, Trekking-, E-MTB-, Cargo-, Falt- und SUV-E-Bikes (Demo-Katalog).'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-[#171C22]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </button>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as 'popular' | 'price_asc' | 'price_desc' | 'newest' | 'rating'
              )
            }
            aria-label="Sortierung"
            className="px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs font-medium bg-white text-[#171C22]"
          >
            <option value="popular">Beliebtheit & Empfehlung</option>
            <option value="price_asc">Preis: aufsteigend</option>
            <option value="price_desc">Preis: absteigend</option>
            <option value="newest">Neuheiten zuerst</option>
            <option value="rating">Beste Bewertung</option>
          </select>
        </div>
      </div>

      {/* Category Quick Tabs */}
      <div className="py-4 flex items-center gap-2 overflow-x-auto border-b border-slate-100">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            if (categorySlug) navigate('/shop');
          }}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[#171C22] text-white'
              : 'bg-[#F4F6F8] text-slate-700 hover:bg-slate-200'
          }`}
        >
          Alle Modelle
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate(`/kategorie/${c.slug}`)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              selectedCategory === c.id || selectedCategory === c.slug
                ? 'bg-[#171C22] text-white'
                : 'bg-[#F4F6F8] text-slate-700 hover:bg-slate-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Desktop Filters */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-xl p-5 sticky top-24">
            {FilterPanel}
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-9">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
            <span>
              <strong className="text-[#171C22] font-mono-nums">{filteredProducts.length}</strong>{' '}
              Ergebnisse gefunden
            </span>
            <span>Preise inkl. 19 % MwSt.</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-[#F4F6F8] border border-slate-200 rounded-xl p-12 text-center">
              <p className="font-display text-lg font-bold text-[#171C22]">
                Keine passenden E-Bikes gefunden
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Passen Sie Ihre Filterkriterien an oder setzen Sie alle Filter zurück.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 px-5 py-2.5 bg-[#171C22] text-white text-xs font-semibold rounded-lg hover:bg-[#1677FF] transition-colors"
              >
                Filter zurücksetzen
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts
                  .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                  .map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>
              {filteredProducts.length > ITEMS_PER_PAGE && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="text-xs text-slate-500 tabular-nums">
                    Seite {page} von {Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
                  </span>
                  <div className="flex items-center gap-2">
                    {Array.from({
                      length: Math.ceil(filteredProducts.length / ITEMS_PER_PAGE),
                    }).map((_, i) => {
                      const pNum = i + 1;
                      return (
                        <button
                          key={pNum}
                          type="button"
                          onClick={() => {
                            setPage(pNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors tabular-nums ${
                            page === pNum
                              ? 'bg-[#171C22] text-white border-[#171C22]'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-[#171C22]'
                          }`}
                        >
                          {pNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/45"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative w-80 max-w-[90vw] bg-white h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display font-bold text-base text-[#171C22]">
                Filter anpassen
              </span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Filter schließen"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            {FilterPanel}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-6 w-full py-3 bg-[#171C22] text-white text-xs font-semibold rounded-lg"
            >
              {filteredProducts.length} Modelle anzeigen
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
