import { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Heart,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatEur } from '../utils/format';
import { SafeImage } from './SafeImage';

export function Header() {
  const {
    settings,
    products,
    categories,
    currentPath,
    navigate,
    cartCount,
    setIsCartOpen,
    wishlistIds,
    compareIds,
    firebaseUser,
    isAdmin,
    t,
  } = useStore();

  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.published)
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.motorBrand.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [searchQuery, products]);

  const navItems = [
    { label: t('navShop'), path: '/shop' },
    { label: t('navFinder'), path: '/kaufberater' },
    { label: t('navBlog'), path: '/ratgeber' },
    { label: t('navAbout'), path: '/ueber-uns' },
    { label: t('navContact'), path: '/kontakt' },
  ];

  const handleNav = (path: string) => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    navigate(path);
  };

  return (
    <div className="sticky top-0 z-40 bg-white">
      {showAnnouncement && settings.announcementText && (
        <div className="bg-[#171C22] text-white text-xs px-4 py-1.5 flex items-center justify-between gap-4">
          <div className="w-5 shrink-0 hidden sm:block" />
          <p className="text-center truncate font-medium tracking-wide">
            {settings.announcementText}
          </p>
          <button
            type="button"
            onClick={() => setShowAnnouncement(false)}
            aria-label="Hinweis schließen"
            className="p-1 text-slate-300 hover:text-white transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[#171C22] hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Menü öffnen"
            >
              <Menu className="w-5 h-5" />
            </button>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNav('/');
              }}
              className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-[#171C22] whitespace-nowrap shrink-0"
            >
              {settings.brandName}
            </a>
          </div>

          {/* Zone 2: Concise single-line nav links */}
          <nav
            aria-label="Hauptnavigation"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            {navItems.map((item) => {
              const active =
                currentPath === item.path ||
                (item.path === '/shop' && currentPath.startsWith('/kategorie/'));
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(item.path);
                  }}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    active
                      ? 'text-[#171C22] border-[#1677FF]'
                      : 'border-transparent hover:text-[#171C22] hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Action controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Suche öffnen"
              className="p-2 text-slate-700 hover:text-[#171C22] hover:bg-[#F4F6F8] rounded-lg transition-colors"
            >
              <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>

            <button
              type="button"
              onClick={() => handleNav('/vergleich')}
              aria-label="E-Bike Vergleich"
              className="hidden sm:inline-flex items-center gap-1 p-2 text-slate-700 hover:text-[#171C22] hover:bg-[#F4F6F8] rounded-lg transition-colors relative"
            >
              <ArrowRightLeft className="w-[18px] h-[18px]" />
              {compareIds.length > 0 && (
                <span className="text-[11px] font-mono-nums font-semibold text-[#1677FF]">
                  {compareIds.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNav('/konto')}
              aria-label="Kundenkonto & Wunschliste"
              className="hidden sm:inline-flex items-center gap-1 p-2 text-slate-700 hover:text-[#171C22] hover:bg-[#F4F6F8] rounded-lg transition-colors"
            >
              <Heart className="w-[18px] h-[18px]" />
              {wishlistIds.length > 0 && (
                <span className="text-[11px] font-mono-nums font-semibold text-[#171C22]">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNav('/konto')}
              aria-label="Kundenkonto"
              className="p-2 text-slate-700 hover:text-[#171C22] hover:bg-[#F4F6F8] rounded-lg transition-colors"
            >
              <User className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${firebaseUser ? 'text-[#1677FF]' : ''}`} />
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNav('/admin')}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1677FF] bg-[#1677FF]/10 hover:bg-[#1677FF]/15 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('navAdmin')}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold bg-[#171C22] text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">{t('cartTitle')}</span>
              <span className="font-mono-nums">({cartCount})</span>
            </button>
          </div>
        </div>

        {/* Autocomplete Search Bar */}
        {searchOpen && (
          <div className="border-t border-slate-200 bg-[#F4F6F8]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      handleNav(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-10 pr-24 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1677FF]"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-3 text-xs font-medium text-slate-500 hover:text-[#171C22] px-2 py-1"
                >
                  Schließen
                </button>
              </div>

              {searchQuery.trim() && (
                <div className="mt-3 bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {searchResults.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">
                      Keine E-Bikes für „{searchQuery}“ gefunden.
                    </p>
                  ) : (
                    searchResults.map((bike) => (
                      <button
                        key={bike.id}
                        type="button"
                        onClick={() => handleNav(`/produkt/${bike.slug}`)}
                        className="w-full flex items-center justify-between gap-4 p-3 hover:bg-[#F4F6F8] text-left transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <SafeImage
                            src={bike.images[0]}
                            alt={bike.imageAlt || bike.name}
                            className="w-14 h-10 object-cover rounded bg-[#F4F6F8] shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500 truncate">
                              {bike.brand} · {bike.categoryName}
                            </p>
                            <p className="text-sm font-semibold text-[#171C22] truncate">
                              {bike.name}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-mono-nums font-semibold text-[#171C22] shrink-0">
                          {formatEur(bike.priceEur)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full overflow-y-auto p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <span className="font-display font-bold text-lg text-[#171C22]">
                  {settings.brandName}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Menü schließen"
                  className="p-2 text-slate-600 hover:text-[#171C22]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNav(item.path)}
                    className="w-full text-left px-3 py-3 text-base font-medium text-[#171C22] hover:bg-[#F4F6F8] rounded-lg transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleNav('/vergleich')}
                  className="w-full text-left px-3 py-3 text-base font-medium text-[#171C22] hover:bg-[#F4F6F8] rounded-lg transition-colors"
                >
                  Modellvergleich ({compareIds.length}/4)
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('/konto')}
                  className="w-full text-left px-3 py-3 text-base font-medium text-[#171C22] hover:bg-[#F4F6F8] rounded-lg transition-colors"
                >
                  Kundenkonto & Merkliste
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('/admin')}
                  className="w-full text-left px-3 py-3 text-base font-medium text-[#1677FF] hover:bg-[#1677FF]/10 rounded-lg transition-colors"
                >
                  Admin-Dashboard
                </button>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Kategorien
                </p>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleNav(`/kategorie/${cat.slug}`)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-[#F4F6F8] rounded-lg"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500">
              {settings.tagline}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
