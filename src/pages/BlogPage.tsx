import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Calendar, Clock, Share2, User } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { SEO_CONTENT_PLAN_TOPICS } from '../data/seedData';
import { formatDateDe } from '../utils/format';
import { applySeoMetadata } from '../utils/seo';

export function BlogPage({ slug }: { slug?: string }) {
  const { blogPosts, settings, navigate, pushToast } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');

  const publishedPosts = useMemo(() => blogPosts.filter((b) => b.published), [blogPosts]);
  const activePost = useMemo(
    () => (slug ? publishedPosts.find((b) => b.slug === slug) : undefined),
    [slug, publishedPosts]
  );

  const categories = useMemo(
    () => ['Alle', ...Array.from(new Set(publishedPosts.map((p) => p.category)))],
    [publishedPosts]
  );

  const filteredPosts = useMemo(
    () =>
      selectedCategory === 'Alle'
        ? publishedPosts
        : publishedPosts.filter((p) => p.category === selectedCategory),
    [publishedPosts, selectedCategory]
  );

  useEffect(() => {
    if (activePost) {
      applySeoMetadata({
        title: activePost.seoTitle || `${activePost.title} | ${settings.brandName}`,
        description: activePost.seoDescription || activePost.excerpt,
        canonicalPath: activePost.canonicalUrl || `/ratgeber/${activePost.slug}`,
        ogType: 'article',
        ogImage: activePost.featuredImage,
        siteName: settings.brandName,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: activePost.title,
          description: activePost.seoDescription || activePost.excerpt,
          image: activePost.featuredImage.startsWith('http')
            ? activePost.featuredImage
            : `${window.location.origin}${activePost.featuredImage}`,
          datePublished: activePost.publishedAt,
          author: {
            '@type': 'Person',
            name: activePost.authorName,
          },
          publisher: {
            '@type': 'Organization',
            name: settings.brandName,
          },
        },
      });
    } else {
      applySeoMetadata({
        title: `E-Bike Ratgeber & Wissenszentrum | ${settings.brandName}`,
        description:
          'Praxisnahe Ratgeber zu E-Bike Reichweite, Akku-Pflege, Pedelec vs. S-Pedelec, Kaufberatung und StVZO-Regeln in Deutschland.',
        canonicalPath: '/ratgeber',
        siteName: settings.brandName,
      });
    }
  }, [activePost, settings.brandName]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url).catch(() => {});
      pushToast('Artikel-Link in die Zwischenablage kopiert.', 'success');
    }
  };

  if (slug && !activePost) {
    return (
      <main className="bg-[#F4F6F8] py-16">
        <div className="max-w-2xl mx-auto px-4 text-center bg-white border border-slate-200 rounded-xl p-10">
          <h1 className="font-display text-2xl font-bold text-[#171C22]">
            Ratgeber-Artikel nicht gefunden
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Der gesuchte Artikel wurde möglicherweise verschoben oder deaktiviert.
          </p>
          <button
            type="button"
            onClick={() => navigate('/ratgeber')}
            className="mt-6 px-5 py-2.5 bg-[#171C22] text-white text-sm font-semibold rounded-md"
          >
            Alle Ratgeber ansehen
          </button>
        </div>
      </main>
    );
  }

  if (activePost) {
    const related = publishedPosts.filter((p) => p.id !== activePost.id).slice(0, 3);
    return (
      <main className="bg-white py-10 sm:py-14">
        <article className="max-w-4xl mx-auto px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/ratgeber')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#1677FF] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Ratgeber-Übersicht
          </button>

          <p className="text-xs font-semibold uppercase tracking-wider text-[#1677FF]">
            {activePost.category}
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-[#171C22] leading-tight">
            {activePost.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#171C22]">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {activePost.authorName} ({activePost.authorRole})
              </span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDateDe(activePost.publishedAt)}
              </span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {activePost.readingMinutes} Min. Lesezeit
              </span>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-md hover:border-[#171C22] text-[#171C22] font-medium"
            >
              <Share2 className="w-3.5 h-3.5" />
              Link teilen
            </button>
          </div>

          <div className="mt-8 aspect-[16/9] rounded-xl overflow-hidden bg-[#F4F6F8] border border-slate-200">
            <SafeImage
              src={activePost.featuredImage}
              alt={activePost.imageAlt || activePost.title}
              className="w-full h-full object-cover"
            />
          </div>

          <p className="mt-8 text-lg font-medium text-slate-800 leading-relaxed">
            {activePost.excerpt}
          </p>

          <div className="mt-6 space-y-5 text-base text-slate-700 leading-relaxed whitespace-pre-line">
            {activePost.content}
          </div>

          <div className="mt-10 bg-[#F4F6F8] border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#171C22]">
                Bereit für die passende Modellauswahl?
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Nutzen Sie unseren E-Bike Kaufberater oder vergleichen Sie bis zu vier Modelle direkt.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/kaufberater')}
                className="px-4 py-2.5 bg-[#171C22] text-white text-xs font-semibold rounded-md hover:bg-[#1677FF] transition-colors"
              >
                Zum Kaufberater
              </button>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="px-4 py-2.5 bg-white border border-slate-300 text-[#171C22] text-xs font-semibold rounded-md"
              >
                Shop ansehen
              </button>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 border-t border-slate-200 pt-12">
            <h2 className="font-display text-2xl font-bold text-[#171C22] mb-6">
              Weitere Ratgeber-Beiträge
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => navigate(`/ratgeber/${post.slug}`)}
                  className="text-left bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-[#1677FF] transition-colors group"
                >
                  <div className="aspect-[16/10] bg-[#F4F6F8] overflow-hidden">
                    <SafeImage
                      src={post.featuredImage}
                      alt={post.imageAlt || post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold text-[#1677FF]">{post.category}</p>
                    <h3 className="mt-1 font-display font-bold text-base text-[#171C22] line-clamp-2">
                      {post.title}
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="bg-[#F4F6F8] min-h-[75vh] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1677FF]">
            <BookOpen className="w-4 h-4" />
            Wissenszentrum Deutschland
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-[#171C22]">
            E-Bike Ratgeber & Kaufberatung
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Fundiertes Wissen rund um Elektrofahrräder, StVZO-Vorgaben, Akku-Pflege, Motorvergleiche und reale Reichweiten auf deutschen Radwegen.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#171C22] text-white border-[#171C22]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-[#171C22]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-[#1677FF] transition-colors group"
            >
              <button
                type="button"
                onClick={() => navigate(`/ratgeber/${post.slug}`)}
                className="aspect-[16/10] bg-[#F4F6F8] overflow-hidden block w-full"
              >
                <SafeImage
                  src={post.featuredImage}
                  alt={post.imageAlt || post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </button>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-[#1677FF]">{post.category}</span>
                  <span className="tabular-nums">{post.readingMinutes} Min. Lesezeit</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/ratgeber/${post.slug}`)}
                  className="mt-2 text-left"
                >
                  <h2 className="font-display text-lg font-bold text-[#171C22] group-hover:text-[#1677FF] transition-colors">
                    {post.title}
                  </h2>
                </button>
                <p className="mt-2 text-sm text-slate-600 line-clamp-3 flex-1">{post.excerpt}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{formatDateDe(post.publishedAt)}</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/ratgeber/${post.slug}`)}
                    className="font-semibold text-[#171C22] hover:text-[#1677FF]"
                  >
                    Artikel lesen →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* 15-Topic German SEO Content Roadmap */}
        <section className="mt-14 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-[#171C22]">
            Redaktioneller Themenplan (15 deutsche SEO-Schwerpunkte)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Alle Artikel und Themen sind direkt im Admin-Dashboard erweiterbar und auf deutsche Suchintentionen ausgerichtet.
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-slate-700">
            {SEO_CONTENT_PLAN_TOPICS.map((topic) => (
              <div key={topic} className="bg-[#F4F6F8] px-3.5 py-2.5 rounded-md border border-slate-200/70">
                {topic}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
