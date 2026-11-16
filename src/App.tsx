import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { CartDrawer } from './components/CartDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Overlays } from './components/Overlays';
import { QuickViewModal } from './components/QuickViewModal';
import { StoreProvider, useStore } from './context/StoreContext';
import { AboutPage } from './pages/AboutPage';
import { AccountPage } from './pages/AccountPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { BlogPage } from './pages/BlogPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ComparePage } from './pages/ComparePage';
import { ContactPage } from './pages/ContactPage';
import { FinderPage } from './pages/FinderPage';
import { HomePage } from './pages/HomePage';
import { LegalPage } from './pages/LegalPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ShopPage } from './pages/ShopPage';

function StorefrontRouter() {
  const { currentPath } = useStore();
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  const normalized = currentPath.replace(/\/+$/, '') || '/';

  const renderPage = () => {
    if (normalized === '/') return <HomePage />;
    if (normalized === '/shop' || normalized === '/e-bikes') return <ShopPage />;
    if (normalized.startsWith('/kategorie/')) {
      const slug = decodeURIComponent(normalized.slice('/kategorie/'.length));
      return <ShopPage categorySlug={slug} />;
    }
    if (normalized.startsWith('/produkt/')) {
      const slug = decodeURIComponent(normalized.slice('/produkt/'.length));
      return <ProductDetailPage slug={slug} />;
    }
    if (normalized === '/vergleich') return <ComparePage />;
    if (normalized === '/kaufberater') return <FinderPage />;
    if (normalized === '/warenkorb') return <CartPage />;
    if (normalized === '/checkout') return <CheckoutPage />;
    if (normalized === '/konto') return <AccountPage />;
    if (normalized === '/ratgeber') return <BlogPage />;
    if (normalized.startsWith('/ratgeber/')) {
      const slug = decodeURIComponent(normalized.slice('/ratgeber/'.length));
      return <BlogPage slug={slug} />;
    }
    if (normalized === '/ueber-uns') return <AboutPage />;
    if (normalized === '/kontakt') return <ContactPage />;
    if (normalized === '/impressum') return <LegalPage kind="impressum" />;
    if (normalized === '/datenschutz') return <LegalPage kind="datenschutz" />;
    if (normalized === '/agb') return <LegalPage kind="agb" />;
    if (normalized === '/widerruf') return <LegalPage kind="widerruf" />;
    if (normalized === '/versand') return <LegalPage kind="versand" />;
    if (normalized === '/admin') return <AdminDashboardPage />;
    return <NotFoundPage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#171C22]">
      {mapsQuotaExceeded && (
        <div
          role="alert"
          className="sticky top-0 z-50 bg-amber-50 border-b border-amber-300 px-4 py-2.5 text-xs text-amber-950 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 max-w-6xl mx-auto">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Das tägliche Demo-Kontingent der Google Maps Platform wurde erreicht oder der Schlüssel ist eingeschränkt.{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline hover:text-amber-800"
              >
                Hinweise & eigenen API-Key hinterlegen
              </a>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMapsQuotaExceeded(false)}
            aria-label="Hinweis schließen"
            className="text-amber-800 hover:text-amber-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Header />
      <div className="flex-1">{renderPage()}</div>
      <Footer />
      <CartDrawer />
      <QuickViewModal />
      <Overlays />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <StorefrontRouter />
      </StoreProvider>
    </ErrorBoundary>
  );
}
