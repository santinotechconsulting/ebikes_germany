import { useEffect, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { applySeoMetadata } from '../utils/seo';

export function NotFoundPage() {
  const { settings, navigate } = useStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    applySeoMetadata({
      title: `404 – Seite nicht gefunden | ${settings.brandName}`,
      description: 'Die angeforderte Seite existiert leider nicht.',
      canonicalPath: '/404',
      noindex: true,
      siteName: settings.brandName,
    });
  }, [settings.brandName]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(query.trim() ? `/shop?q=${encodeURIComponent(query.trim())}` : '/shop');
  };

  return (
    <main className="bg-[#F4F6F8] min-h-[70vh] flex items-center py-16">
      <div className="max-w-xl mx-auto px-4 text-center">
        <p className="font-mono text-sm font-bold text-[#1677FF] tracking-widest">FEHLER 404</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-[#171C22]">
          Diese Strecke existiert leider nicht.
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Die aufgerufene Adresse wurde möglicherweise geändert oder existiert nicht mehr. Nutzen Sie die Suche oder kehren Sie zur Startseite zurück.
        </p>

        <form onSubmit={handleSearch} className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E-Bike Modell oder Marke suchen..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-md"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#171C22] text-white text-sm font-semibold rounded-md hover:bg-[#1677FF] transition-colors"
          >
            Suchen
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-300 text-sm font-semibold text-[#171C22] rounded-md hover:border-[#171C22]"
          >
            Zur Startseite
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="px-5 py-2.5 bg-[#1677FF] text-white text-sm font-semibold rounded-md"
          >
            Zum E-Bike Katalog
          </button>
        </div>
      </div>
    </main>
  );
}
