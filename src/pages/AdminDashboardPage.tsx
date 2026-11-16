import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  Download,
  FileSearch,
  Layers,
  Lock,
  LogIn,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Settings,
  ShoppingCart,
  Tag,
  Trash2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { IMG_CITY } from '../data/seedData';
import type {
  BlogPost,
  Brand,
  Category,
  Coupon,
  Faq,
  FrameType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  SiteSettings,
} from '../types/store';
import { createSafeId, formatDateDe, formatEur, slugify } from '../utils/format';
import { downloadOrderInvoicePdf } from '../utils/invoicePdf';
import { applySeoMetadata } from '../utils/seo';

type AdminTab =
  | 'overview'
  | 'products'
  | 'taxonomy'
  | 'orders'
  | 'customers'
  | 'coupons'
  | 'cms'
  | 'seo'
  | 'audit';

export function AdminDashboardPage() {
  const {
    authReady,
    firebaseUser,
    isAdmin,
    signInWithGoogle,
    settings,
    categories,
    brands,
    products,
    orders,
    coupons,
    blogPosts,
    faqs,
    enquiries,
    auditLogs,
    firestoreSeeded,
    seedFirestoreWithDemoData,
    adminSaveProduct,
    adminDeleteProduct,
    adminSaveCategory,
    adminDeleteCategory,
    adminSaveBrand,
    adminDeleteBrand,
    adminSaveSettings,
    adminSaveBlogPost,
    adminDeleteBlogPost,
    adminSaveFaq,
    adminDeleteFaq,
    adminSaveCoupon,
    adminDeleteCoupon,
    adminUpdateOrder,
    adminUpdateEnquiryStatus,
    pushToast,
  } = useStore();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [seeding, setSeeding] = useState(false);

  // Product editor state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodSearch, setProdSearch] = useState('');

  // Category & Brand forms
  const [catForm, setCatForm] = useState<Category | null>(null);
  const [brandForm, setBrandForm] = useState<Brand | null>(null);

  // Order filter & tracking draft
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, { carrier: string; number: string }>>({});

  // Coupon editor
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'fixed' | 'free_shipping'>('percent');
  const [couponValue, setCouponValue] = useState(10);
  const [couponMin, setCouponMin] = useState(1000);
  const [couponDesc, setCouponDesc] = useState('');

  // Settings form
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings>(settings);
  const [blogDraft, setBlogDraft] = useState<BlogPost | null>(null);
  const [faqDraft, setFaqDraft] = useState<Faq | null>(null);

  useEffect(() => {
    setSettingsDraft(settings);
  }, [settings]);

  useEffect(() => {
    applySeoMetadata({
      title: `Admin Dashboard | ${settings.brandName}`,
      description: 'Storefront Verwaltung, Katalog, Bestellungen und SEO Audit.',
      canonicalPath: '/admin',
      noindex: true,
      siteName: settings.brandName,
    });
  }, [settings.brandName]);

  // Analytics & KPIs
  const kpis = useMemo(() => {
    const validOrders = orders.filter((o) => o.orderStatus !== 'cancelled' && o.orderStatus !== 'refunded');
    const revenue = validOrders.reduce((s, o) => s + o.totalEur, 0);
    const pendingCount = orders.filter((o) => o.orderStatus === 'pending' || o.orderStatus === 'processing').length;
    const completedCount = orders.filter((o) => o.orderStatus === 'paid' || o.orderStatus === 'delivered' || o.orderStatus === 'shipped').length;
    const cancelledCount = orders.filter((o) => o.orderStatus === 'cancelled' || o.orderStatus === 'refunded').length;
    const uniqueCustomers = new Set(orders.map((o) => o.customerEmail.toLowerCase())).size;
    const lowStock = products.filter((p) => p.stock <= 3);
    return {
      revenue,
      totalOrders: orders.length,
      pendingCount,
      completedCount,
      cancelledCount,
      uniqueCustomers,
      lowStock,
    };
  }, [orders, products]);

  // Monthly revenue chart data (last 6 months + live orders bucket)
  const monthlySeries = useMemo(() => {
    const base = [
      { label: 'Jun', eur: 14800 },
      { label: 'Jul', eur: 19400 },
      { label: 'Aug', eur: 22100 },
      { label: 'Sep', eur: 18900 },
      { label: 'Okt', eur: 24600 },
      { label: 'Nov', eur: Math.max(8500, kpis.revenue) },
    ];
    const max = Math.max(...base.map((b) => b.eur), 1);
    return { items: base, max };
  }, [kpis.revenue]);

  // SEO Audit checks
  const seoAuditIssues = useMemo(() => {
    const issues: { type: 'Warnung' | 'Hinweis'; entity: string; detail: string }[] = [];
    const slugCount: Record<string, number> = {};

    products.forEach((p) => {
      slugCount[p.slug] = (slugCount[p.slug] || 0) + 1;
      if (!p.seoTitle || p.seoTitle.length > 68) {
        issues.push({
          type: 'Warnung',
          entity: `Produkt: ${p.name}`,
          detail: !p.seoTitle ? 'SEO-Titel fehlt.' : `SEO-Titel zu lang (${p.seoTitle.length} Zeichen, Empfehlung <= 65).`,
        });
      }
      if (!p.seoDescription || p.seoDescription.length < 50) {
        issues.push({
          type: 'Hinweis',
          entity: `Produkt: ${p.name}`,
          detail: 'Meta-Beschreibung fehlt oder ist sehr kurz (< 50 Zeichen).',
        });
      }
      if (!p.imageAlt) {
        issues.push({
          type: 'Warnung',
          entity: `Produkt: ${p.name}`,
          detail: 'Bild-Alt-Text fehlt.',
        });
      }
      if (!p.focusKeyword) {
        issues.push({
          type: 'Hinweis',
          entity: `Produkt: ${p.name}`,
          detail: 'Focus-Keyword fehlt.',
        });
      }
    });

    Object.entries(slugCount).forEach(([slug, count]) => {
      if (count > 1) {
        issues.push({
          type: 'Warnung',
          entity: `Slug /produkt/${slug}`,
          detail: `Doppelter URL-Slug (${count}× vergeben).`,
        });
      }
    });

    categories.forEach((c) => {
      if (!c.seoTitle || !c.seoDescription) {
        issues.push({
          type: 'Warnung',
          entity: `Kategorie: ${c.name}`,
          detail: 'SEO-Titel oder Meta-Beschreibung unvollständig.',
        });
      }
    });

    blogPosts.forEach((b) => {
      if (!b.seoTitle || !b.seoDescription) {
        issues.push({
          type: 'Hinweis',
          entity: `Ratgeber: ${b.title}`,
          detail: 'SEO-Metadaten prüfen.',
        });
      }
    });

    return issues;
  }, [products, categories, blogPosts]);

  if (!authReady) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-[#F4F6F8]">
        <p className="text-sm text-slate-600">Authentifizierung wird geprüft...</p>
      </main>
    );
  }

  if (!firebaseUser) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-[#F4F6F8] p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center">
          <Lock className="w-10 h-10 text-[#171C22] mx-auto" />
          <h1 className="mt-4 font-display text-2xl font-bold text-[#171C22]">
            Admin-Anmeldung erforderlich
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Melden Sie sich mit Ihrem autorisierten Administrator-Konto an, um Katalog, Bestellungen und Shop-Konfiguration zu verwalten.
          </p>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-[#171C22] text-white text-sm font-semibold rounded-md hover:bg-[#1677FF] transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Mit Google anmelden
          </button>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-[#F4F6F8] p-4">
        <div className="bg-white border border-rose-200 rounded-xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
          <h1 className="mt-4 font-display text-xl font-bold text-[#171C22]">
            Zugriff verweigert
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Das angemeldete Konto ({firebaseUser.email}) verfügt nicht über Administrator-Berechtigungen für diesen Shop.
          </p>
        </div>
      </main>
    );
  }

  const startNewProduct = () => {
    setEditingProduct({
      id: createSafeId('prod'),
      sku: `EMB-NEW-${Math.floor(100 + Math.random() * 900)}`,
      slug: '',
      name: '',
      brand: brands[0]?.name || 'Kalkhoff',
      categoryId: categories[0]?.id || 'city-ebikes',
      categoryName: categories[0]?.name || 'City E-Bikes',
      priceEur: 3299,
      previousPriceEur: undefined,
      shortDescription: '',
      description: '',
      images: [IMG_CITY],
      colors: ['Graphit Matt'],
      frameSizes: ['M (48 cm)', 'L (53 cm)'],
      frameType: 'Diamant',
      motorBrand: 'Bosch',
      motorModel: 'Bosch Performance Line',
      motorPowerW: 250,
      motorTorqueNm: 75,
      maxAssistedSpeedKmh: 25,
      isSPedelec: false,
      batteryWh: 625,
      chargingTimeHours: 4.5,
      rangeKmMin: 70,
      rangeKmMax: 130,
      rangeNote: 'Abhängig von Unterstützungsstufe, Gewicht und Topografie.',
      frameMaterial: 'Aluminium 6061',
      brakeSystem: 'Shimano MT400 hydraulisch',
      gearSystem: 'Shimano Deore 10-fach',
      weightKg: 24.5,
      warrantyYears: 2,
      stock: 5,
      featured: false,
      isNewArrival: true,
      isSpecialOffer: false,
      published: true,
      ceConformity: 'CE EN 15194 (Pedelec 25 km/h)',
      manufacturerInfo: 'Herstellerangaben im Admin konfigurierbar',
      safetyNotes: 'Vor Fahrtantritt Bremsen und Reifendruck prüfen.',
      seoTitle: '',
      seoDescription: '',
      focusKeyword: '',
      canonicalUrl: '',
      ogImage: IMG_CITY,
      imageAlt: '',
      ratingAvg: 5,
      reviewCount: 0,
      isDemoData: false,
    });
  };

  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const cat = categories.find((c) => c.id === editingProduct.categoryId);
    const slug = editingProduct.slug.trim() || slugify(`${editingProduct.brand}-${editingProduct.name}`);
    await adminSaveProduct({
      ...editingProduct,
      slug,
      categoryName: cat?.name || editingProduct.categoryName,
      canonicalUrl: editingProduct.canonicalUrl || `/produkt/${slug}`,
      seoTitle: editingProduct.seoTitle || `${editingProduct.brand} ${editingProduct.name} | ${settings.brandName}`,
      isSPedelec: editingProduct.maxAssistedSpeedKmh === 45,
    });
    setEditingProduct(null);
  };

  const handleRefundOrder = async (orderId: string, intentId: string, orderNumber: string) => {
    try {
      const resp = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentId, orderNumber }),
      });
      if (!resp.ok) {
        const d = await resp.json();
        throw new Error(d.error || 'Erstattung fehlgeschlagen.');
      }
      await adminUpdateOrder(orderId, {
        orderStatus: 'refunded',
        paymentStatus: 'refunded',
      });
      pushToast(`Erstattung für ${orderNumber} verbucht.`, 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Fehler bei Erstattung', 'error');
    }
  };

  const handleSeedFirestore = async () => {
    setSeeding(true);
    await seedFirestoreWithDemoData();
    setSeeding(false);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(prodSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
    const q = orderSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const navItems: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: 'Übersicht & KPIs', icon: BarChart3 },
    { id: 'products', label: 'Produkte', icon: Package },
    { id: 'taxonomy', label: 'Kategorien & Marken', icon: Layers },
    { id: 'orders', label: 'Bestellungen', icon: ShoppingCart },
    { id: 'customers', label: 'Anfragen & Leads', icon: MessageSquare },
    { id: 'coupons', label: 'Gutscheine', icon: Tag },
    { id: 'cms', label: 'Shop, CMS & Rechtliches', icon: Settings },
    { id: 'seo', label: 'SEO Audit', icon: FileSearch },
    { id: 'audit', label: 'Audit-Log', icon: Activity },
  ];

  return (
    <main className="bg-[#F4F6F8] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header Bar */}
        <div className="bg-[#171C22] text-white rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1677FF]">
              Storefront Administration · {settings.brandName}
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Angemeldet als {firebaseUser.email} · Firestore Status:{' '}
              {firestoreSeeded ? 'Synchronisiert' : 'Demo-Fallback aktiv'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedFirestore}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1677FF] text-white text-xs font-semibold rounded-md hover:bg-[#1262d4] disabled:bg-slate-600 transition-colors whitespace-nowrap shrink-0"
            >
              <Database className="w-4 h-4" />
              {seeding ? 'Speichert...' : 'Demo-Daten in Firestore seeden'}
            </button>
          </div>
        </div>

        {/* Admin Tab Strip */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                tab === item.id
                  ? 'bg-[#171C22] text-white border-[#171C22]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-[#171C22]'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* 1. OVERVIEW */}
        {tab === 'overview' && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Gesamtumsatz (erfasst)', value: formatEur(kpis.revenue) },
                { label: 'Bestellungen gesamt', value: String(kpis.totalOrders) },
                { label: 'Ausstehend / In Arbeit', value: String(kpis.pendingCount) },
                { label: 'Abgeschlossen / Versendet', value: String(kpis.completedCount) },
                { label: 'Storniert / Erstattet', value: String(kpis.cancelledCount) },
                { label: 'Eindeutige Käufer', value: String(kpis.uniqueCustomers) },
                { label: 'Veröffentlichte E-Bikes', value: String(products.filter((p) => p.published).length) },
                { label: 'SEO Audit Hinweise', value: String(seoAuditIssues.length) },
              ].map((card) => (
                <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-5">
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <p className="mt-2 font-display text-2xl font-bold text-[#171C22] tabular-nums">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Monthly Sales SVG Chart */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="font-display text-lg font-bold text-[#171C22]">
                  Monatlicher Umsatzverlauf (EUR, inklusive Live-Bestellungen)
                </h2>
                <div className="mt-6">
                  <svg viewBox="0 0 540 200" className="w-full h-48 overflow-visible">
                    {monthlySeries.items.map((item, idx) => {
                      const barWidth = 52;
                      const x = idx * 86 + 24;
                      const barHeight = Math.round((item.eur / monthlySeries.max) * 140);
                      const y = 165 - barHeight;
                      return (
                        <g key={item.label}>
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            rx={4}
                            fill={idx === monthlySeries.items.length - 1 ? '#1677FF' : '#171C22'}
                          />
                          <text
                            x={x + barWidth / 2}
                            y={y - 6}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#475569"
                          >
                            {Math.round(item.eur / 1000)}k €
                          </text>
                          <text
                            x={x + barWidth / 2}
                            y={186}
                            textAnchor="middle"
                            fontSize="11"
                            fill="#171C22"
                            fontWeight="600"
                          >
                            {item.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="font-display text-lg font-bold text-[#171C22]">
                  Niedriger Lagerbestand (≤ 3 Stk.)
                </h2>
                <div className="mt-4 divide-y divide-slate-100">
                  {kpis.lowStock.length === 0 ? (
                    <p className="text-sm text-slate-500">Alle Modelle sind ausreichend vorrätig.</p>
                  ) : (
                    kpis.lowStock.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-[#171C22]">
                            {p.brand} {p.name}
                          </p>
                          <p className="text-xs text-slate-500">SKU {p.sku}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded tabular-nums ${
                            p.stock === 0 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {p.stock} Stk.
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PRODUCTS CRUD */}
        {tab === 'products' && (
          <div className="mt-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <input
                type="search"
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                placeholder="Produkt, Marke oder SKU suchen..."
                className="px-3 py-2 text-sm border border-slate-200 rounded-md w-full sm:w-72"
              />
              <button
                type="button"
                onClick={startNewProduct}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#1677FF] text-white text-xs font-semibold rounded-md hover:bg-[#1262d4]"
              >
                <Plus className="w-4 h-4" />
                Neues E-Bike anlegen
              </button>
            </div>

            {editingProduct && (
              <form
                onSubmit={handleSaveProductForm}
                className="bg-white border border-[#1677FF] rounded-xl p-6 space-y-4"
              >
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h2 className="font-display text-lg font-bold text-[#171C22]">
                    {editingProduct.name ? `Bearbeiten: ${editingProduct.name}` : 'Neues E-Bike anlegen'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="text-xs text-slate-500 hover:text-[#171C22]"
                  >
                    Abbrechen
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Modellname *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Marke *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.brand}
                      onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Kategorie</label>
                    <select
                      value={editingProduct.categoryId}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, categoryId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">SKU *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.sku}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Preis (EUR) *</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.priceEur}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, priceEur: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Streichpreis (EUR)</label>
                    <input
                      type="number"
                      value={editingProduct.previousPriceEur || ''}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          previousPriceEur: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Lagerbestand *</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.stock}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Rahmentyp</label>
                    <select
                      value={editingProduct.frameType}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, frameType: e.target.value as FrameType })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                    >
                      {(['Diamant', 'Trapez', 'Tiefeinsteiger', 'Fully', 'Kompakt', 'Cargo'] as FrameType[]).map(
                        (ft) => (
                          <option key={ft} value={ft}>
                            {ft}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Motorhersteller</label>
                    <input
                      type="text"
                      value={editingProduct.motorBrand}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, motorBrand: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Akku (Wh)</label>
                    <input
                      type="number"
                      value={editingProduct.batteryWh}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, batteryWh: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Unterstützung (km/h)</label>
                    <select
                      value={editingProduct.maxAssistedSpeedKmh}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          maxAssistedSpeedKmh: Number(e.target.value) as 25 | 45,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                    >
                      <option value={25}>25 km/h (Pedelec)</option>
                      <option value={45}>45 km/h (S-Pedelec)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Gewicht (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingProduct.weightKg}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, weightKg: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md tabular-nums"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Kurzbeschreibung</label>
                    <input
                      type="text"
                      value={editingProduct.shortDescription}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, shortDescription: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">SEO Titel</label>
                    <input
                      type="text"
                      value={editingProduct.seoTitle}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, seoTitle: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Bild-Alt-Text</label>
                    <input
                      type="text"
                      value={editingProduct.imageAlt}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, imageAlt: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">CE / GPSR Konformität</label>
                    <input
                      type="text"
                      value={editingProduct.ceConformity}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, ceConformity: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">SEO Meta-Beschreibung</label>
                    <input
                      type="text"
                      value={editingProduct.seoDescription}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, seoDescription: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 pt-2 text-xs font-medium text-slate-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProduct.published}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, published: e.target.checked })
                      }
                    />
                    Veröffentlicht
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProduct.featured}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, featured: e.target.checked })
                      }
                    />
                    Bestseller
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProduct.isNewArrival}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, isNewArrival: e.target.checked })
                      }
                    />
                    Neuheit
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProduct.isSpecialOffer}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, isSpecialOffer: e.target.checked })
                      }
                    />
                    Sonderangebot
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#171C22] text-white text-xs font-semibold rounded-md hover:bg-[#1677FF]"
                  >
                    Produkt speichern
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[760px]">
                <thead className="bg-[#F4F6F8] text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-4">Modell & Marke</th>
                    <th className="p-4">Kategorie</th>
                    <th className="p-4">Preis</th>
                    <th className="p-4">Bestand</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <p className="font-semibold text-[#171C22]">
                          {p.brand} {p.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          SKU {p.sku} · {p.motorBrand} · {p.batteryWh} Wh
                        </p>
                      </td>
                      <td className="p-4 text-slate-600">{p.categoryName}</td>
                      <td className="p-4 font-semibold tabular-nums">{formatEur(p.priceEur)}</td>
                      <td className="p-4 tabular-nums">{p.stock}</td>
                      <td className="p-4 text-xs font-semibold">
                        {p.published ? (
                          <span className="text-emerald-700">Aktiv</span>
                        ) : (
                          <span className="text-slate-400">Entwurf</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-3">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(p)}
                          className="text-xs font-semibold text-[#1677FF] hover:underline"
                        >
                          Bearbeiten
                        </button>
                        <button
                          type="button"
                          onClick={() => adminDeleteProduct(p.id)}
                          className="text-xs font-semibold text-rose-600 hover:underline"
                        >
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. CATEGORIES & BRANDS */}
        {tab === 'taxonomy' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-lg font-bold text-[#171C22]">Kategorien</h2>
                <button
                  type="button"
                  onClick={() =>
                    setCatForm({
                      id: createSafeId('cat'),
                      slug: '',
                      name: '',
                      description: '',
                      image: IMG_CITY,
                      seoTitle: '',
                      seoDescription: '',
                      focusKeyword: '',
                      sortOrder: categories.length + 1,
                    })
                  }
                  className="text-xs font-semibold text-[#1677FF]"
                >
                  + Kategorie
                </button>
              </div>

              {catForm && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await adminSaveCategory({
                      ...catForm,
                      slug: catForm.slug || slugify(catForm.name),
                    });
                    setCatForm(null);
                  }}
                  className="bg-[#F4F6F8] p-4 rounded-lg space-y-3 text-sm"
                >
                  <input
                    type="text"
                    required
                    placeholder="Kategoriename"
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="SEO Titel"
                    value={catForm.seoTitle}
                    onChange={(e) => setCatForm({ ...catForm, seoTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Meta Beschreibung"
                    value={catForm.seoDescription}
                    onChange={(e) => setCatForm({ ...catForm, seoDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1.5 bg-[#171C22] text-white text-xs rounded">
                      Speichern
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatForm(null)}
                      className="px-3 py-1.5 text-xs text-slate-600"
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-slate-100 text-sm">
                {categories.map((c) => (
                  <div key={c.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-[#171C22]">{c.name}</p>
                      <p className="text-xs text-slate-500">/kategorie/{c.slug}</p>
                    </div>
                    <div className="space-x-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setCatForm(c)}
                        className="text-[#1677FF] font-semibold"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => adminDeleteCategory(c.id)}
                        className="text-rose-600"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-lg font-bold text-[#171C22]">Hersteller & Marken</h2>
                <button
                  type="button"
                  onClick={() =>
                    setBrandForm({
                      id: createSafeId('brand'),
                      slug: '',
                      name: '',
                      country: 'Deutschland',
                      description: '',
                    })
                  }
                  className="text-xs font-semibold text-[#1677FF]"
                >
                  + Marke
                </button>
              </div>

              {brandForm && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await adminSaveBrand({
                      ...brandForm,
                      slug: brandForm.slug || slugify(brandForm.name),
                    });
                    setBrandForm(null);
                  }}
                  className="bg-[#F4F6F8] p-4 rounded-lg space-y-3 text-sm"
                >
                  <input
                    type="text"
                    required
                    placeholder="Markenname"
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Herkunft (z. B. Deutschland)"
                    value={brandForm.country}
                    onChange={(e) => setBrandForm({ ...brandForm, country: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1.5 bg-[#171C22] text-white text-xs rounded">
                      Speichern
                    </button>
                    <button
                      type="button"
                      onClick={() => setBrandForm(null)}
                      className="px-3 py-1.5 text-xs text-slate-600"
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-slate-100 text-sm">
                {brands.map((b) => (
                  <div key={b.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-[#171C22]">{b.name}</p>
                      <p className="text-xs text-slate-500">{b.country}</p>
                    </div>
                    <div className="space-x-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setBrandForm(b)}
                        className="text-[#1677FF] font-semibold"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => adminDeleteBrand(b.id)}
                        className="text-rose-600"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. ORDERS MANAGEMENT */}
        {tab === 'orders' && (
          <div className="mt-6 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap gap-3 justify-between">
              <input
                type="search"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Bestellnummer, Kunde oder E-Mail..."
                className="px-3 py-2 text-sm border border-slate-200 rounded-md w-full sm:w-72"
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white"
              >
                <option value="all">Alle Status</option>
                <option value="pending">Ausstehend (pending)</option>
                <option value="paid">Bezahlt (paid)</option>
                <option value="processing">In Bearbeitung</option>
                <option value="shipped">Versendet</option>
                <option value="delivered">Geliefert</option>
                <option value="cancelled">Storniert</option>
                <option value="refunded">Erstattet</option>
              </select>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
                Keine Bestellungen im ausgewählten Filter vorhanden.
              </div>
            ) : (
              filteredOrders.map((order) => {
                const draft = trackingDrafts[order.id] || {
                  carrier: order.shippingCarrier || 'DHL Freight / Fahrrad-Spedition',
                  number: order.trackingNumber || '',
                };
                return (
                  <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <div className="flex flex-wrap justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <p className="font-mono font-bold text-[#171C22]">
                          {order.orderNumber} · {order.customerName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.customerEmail} · {formatDateDe(order.createdAt)} · {order.paymentProvider}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display font-bold text-lg text-[#171C22] tabular-nums">
                          {formatEur(order.totalEur)}
                        </span>
                        <button
                          type="button"
                          onClick={() => downloadOrderInvoicePdf(order, settings)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-md hover:border-[#171C22]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-500 mb-1">Bestellstatus</label>
                        <select
                          value={order.orderStatus}
                          onChange={(e) =>
                            adminUpdateOrder(order.id, { orderStatus: e.target.value as OrderStatus })
                          }
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-md bg-white"
                        >
                          {(['pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'] as OrderStatus[]).map(
                            (st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Zahlungsstatus</label>
                        <select
                          value={order.paymentStatus}
                          onChange={(e) =>
                            adminUpdateOrder(order.id, { paymentStatus: e.target.value as PaymentStatus })
                          }
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-md bg-white"
                        >
                          {(['pending', 'verified', 'failed', 'refunded'] as PaymentStatus[]).map((ps) => (
                            <option key={ps} value={ps}>
                              {ps}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Spedition / Versanddienstleister</label>
                        <input
                          type="text"
                          value={draft.carrier}
                          onChange={(e) =>
                            setTrackingDrafts({
                              ...trackingDrafts,
                              [order.id]: { ...draft, carrier: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Sendungsnummer</label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={draft.number}
                            onChange={(e) =>
                              setTrackingDrafts({
                                ...trackingDrafts,
                                [order.id]: { ...draft, number: e.target.value },
                              })
                            }
                            placeholder="Tracking-ID"
                            className="w-full px-2.5 py-2 border border-slate-200 rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              adminUpdateOrder(order.id, {
                                shippingCarrier: draft.carrier,
                                trackingNumber: draft.number,
                              })
                            }
                            className="px-2.5 py-2 bg-[#171C22] text-white rounded-md shrink-0"
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    </div>

                    {order.paymentStatus === 'verified' && order.orderStatus !== 'refunded' && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleRefundOrder(order.id, order.paymentIntentId, order.orderNumber)
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:underline"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Zahlung über Server erstatten (Refund)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 5. CUSTOMERS & ENQUIRIES */}
        {tab === 'customers' && (
          <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-display text-lg font-bold text-[#171C22] mb-4">
              Kontaktanfragen, Verfügbarkeits-Alerts & Newsletter
            </h2>
            {enquiries.length === 0 ? (
              <p className="text-sm text-slate-500">Noch keine Anfragen eingegangen.</p>
            ) : (
              <div className="divide-y divide-slate-200">
                {enquiries.map((enq) => (
                  <div key={enq.id} className="py-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#1677FF]">
                        {enq.type} · {formatDateDe(enq.createdAt)}
                      </p>
                      <p className="font-semibold text-[#171C22] text-sm">
                        {enq.name ? `${enq.name} (${enq.email})` : enq.email}
                      </p>
                      {enq.subject && <p className="text-xs font-medium text-slate-700 mt-0.5">{enq.subject}</p>}
                      {enq.message && <p className="text-xs text-slate-600 mt-1">{enq.message}</p>}
                      {enq.productName && (
                        <p className="text-xs text-slate-600 mt-1">Produkt: {enq.productName}</p>
                      )}
                    </div>
                    <select
                      value={enq.status}
                      onChange={(e) =>
                        adminUpdateEnquiryStatus(enq.id, e.target.value as 'new' | 'replied' | 'closed')
                      }
                      className="h-9 px-3 text-xs border border-slate-200 rounded-md bg-white self-start"
                    >
                      <option value="new">Neu</option>
                      <option value="replied">Beantwortet</option>
                      <option value="closed">Abgeschlossen</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. COUPONS */}
        {tab === 'coupons' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!couponCode.trim()) return;
                await adminSaveCoupon({
                  id: createSafeId('coupon'),
                  code: couponCode.trim().toUpperCase(),
                  type: couponType,
                  value: couponValue,
                  minPurchaseEur: couponMin,
                  startDate: '2026-01-01',
                  expiryDate: '2027-12-31',
                  active: true,
                  description: couponDesc || 'Aktionscode',
                });
                setCouponCode('');
                setCouponDesc('');
              }}
              className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-sm self-start"
            >
              <h2 className="font-display text-lg font-bold text-[#171C22]">Neuen Gutschein erstellen</h2>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Code *</label>
                <input
                  type="text"
                  required
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="SOMMER150"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md uppercase"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Rabatt-Typ</label>
                <select
                  value={couponType}
                  onChange={(e) => setCouponType(e.target.value as typeof couponType)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                >
                  <option value="percent">Prozent (%)</option>
                  <option value="fixed">Festbetrag (EUR)</option>
                  <option value="free_shipping">Kostenloser Versand</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Wert</label>
                  <input
                    type="number"
                    value={couponValue}
                    onChange={(e) => setCouponValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Mindestwert (EUR)</label>
                  <input
                    type="number"
                    value={couponMin}
                    onChange={(e) => setCouponMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md tabular-nums"
                  />
                </div>
              </div>
              <input
                type="text"
                value={couponDesc}
                onChange={(e) => setCouponDesc(e.target.value)}
                placeholder="Beschreibung"
                className="w-full px-3 py-2 border border-slate-200 rounded-md"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#171C22] text-white text-xs font-semibold rounded-md hover:bg-[#1677FF]"
              >
                Gutschein speichern
              </button>
            </form>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 divide-y divide-slate-200">
              {coupons.map((c) => (
                <div key={c.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-mono font-bold text-[#171C22]">{c.code}</p>
                    <p className="text-xs text-slate-500">
                      {c.description} · ab {formatEur(c.minPurchaseEur)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => adminSaveCoupon({ ...c, active: !c.active })}
                      className={`px-2.5 py-1 rounded font-semibold ${
                        c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {c.active ? 'Aktiv' : 'Pausiert'}
                    </button>
                    <button
                      type="button"
                      onClick={() => adminDeleteCoupon(c.id)}
                      className="text-rose-600 hover:underline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. CMS, BRAND & LEGAL */}
        {tab === 'cms' && (
          <div className="mt-6 space-y-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await adminSaveSettings(settingsDraft);
              }}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 text-sm"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h2 className="font-display text-lg font-bold text-[#171C22]">
                  Markenname, Storefront-Texte, Zahlungsarten & Rechtstexte
                </h2>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1677FF] text-white text-xs font-semibold rounded-md hover:bg-[#1262d4]"
                >
                  Einstellungen speichern
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Markenname (im gesamten Shop dynamisch)
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.brandName}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, brandName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={settingsDraft.tagline}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, tagline: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ankündigungsleiste</label>
                  <input
                    type="text"
                    value={settingsDraft.announcementText}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, announcementText: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Hero Headline</label>
                  <input
                    type="text"
                    value={settingsDraft.heroHeadline}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, heroHeadline: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    WhatsApp Nummer (optional)
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.whatsappNumber}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, whatsappNumber: e.target.value })
                    }
                    placeholder="+49170..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    GA4 Measurement ID (Consent-pflichtig)
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.ga4MeasurementId}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, ga4MeasurementId: e.target.value })
                    }
                    placeholder="G-XXXXXXXXXX"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Meta Pixel ID (Consent-pflichtig)
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.metaPixelId}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, metaPixelId: e.target.value })
                    }
                    placeholder="1234567890"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Aktive Zahlungsmethoden</p>
                <div className="flex flex-wrap gap-4 text-xs">
                  {(['card', 'paypal', 'klarna', 'sepa', 'bank_transfer'] as PaymentMethod[]).map((pm) => (
                    <label key={pm} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={settingsDraft.paymentMethods.includes(pm)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...settingsDraft.paymentMethods, pm]
                            : settingsDraft.paymentMethods.filter((x) => x !== pm);
                          setSettingsDraft({ ...settingsDraft, paymentMethods: next });
                        }}
                      />
                      {pm}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Impressum</label>
                  <textarea
                    rows={4}
                    value={settingsDraft.legalImpressum}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, legalImpressum: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">AGB</label>
                  <textarea
                    rows={4}
                    value={settingsDraft.legalAgb}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, legalAgb: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono text-xs"
                  />
                </div>
              </div>
            </form>

            {/* Blog & FAQ quick managers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-[#171C22]">Ratgeber-Artikel</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setBlogDraft({
                        id: createSafeId('blog'),
                        slug: '',
                        title: '',
                        category: 'Kaufberatung',
                        excerpt: '',
                        content: '',
                        authorName: 'Redaktion',
                        authorRole: 'E-Bike Fachberatung',
                        featuredImage: IMG_CITY,
                        imageAlt: '',
                        publishedAt: new Date().toISOString().split('T')[0],
                        readingMinutes: 5,
                        seoTitle: '',
                        seoDescription: '',
                        focusKeyword: '',
                        canonicalUrl: '',
                        published: true,
                        isDemoData: false,
                      })
                    }
                    className="text-xs font-semibold text-[#1677FF]"
                  >
                    + Artikel
                  </button>
                </div>

                {blogDraft && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const s = blogDraft.slug || slugify(blogDraft.title);
                      await adminSaveBlogPost({
                        ...blogDraft,
                        slug: s,
                        canonicalUrl: blogDraft.canonicalUrl || `/ratgeber/${s}`,
                      });
                      setBlogDraft(null);
                    }}
                    className="bg-[#F4F6F8] p-4 rounded-lg space-y-2.5 text-xs"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Titel"
                      value={blogDraft.title}
                      onChange={(e) => setBlogDraft({ ...blogDraft, title: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Kurzfassung / Excerpt"
                      value={blogDraft.excerpt}
                      onChange={(e) => setBlogDraft({ ...blogDraft, excerpt: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded"
                    />
                    <textarea
                      rows={4}
                      placeholder="Artikeltext"
                      value={blogDraft.content}
                      onChange={(e) => setBlogDraft({ ...blogDraft, content: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="px-3 py-1.5 bg-[#171C22] text-white rounded">
                        Speichern
                      </button>
                      <button type="button" onClick={() => setBlogDraft(null)}>
                        Abbrechen
                      </button>
                    </div>
                  </form>
                )}

                <div className="divide-y divide-slate-100 text-xs">
                  {blogPosts.map((b) => (
                    <div key={b.id} className="py-2.5 flex justify-between items-center gap-2">
                      <span className="font-medium text-[#171C22] truncate">{b.title}</span>
                      <div className="space-x-2 shrink-0">
                        <button type="button" onClick={() => setBlogDraft(b)} className="text-[#1677FF]">
                          Bearbeiten
                        </button>
                        <button
                          type="button"
                          onClick={() => adminDeleteBlogPost(b.id)}
                          className="text-rose-600"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-[#171C22]">FAQs verwalten</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setFaqDraft({
                        id: createSafeId('faq'),
                        question: '',
                        answer: '',
                        category: 'Allgemein',
                        sortOrder: faqs.length + 1,
                      })
                    }
                    className="text-xs font-semibold text-[#1677FF]"
                  >
                    + FAQ
                  </button>
                </div>

                {faqDraft && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await adminSaveFaq(faqDraft);
                      setFaqDraft(null);
                    }}
                    className="bg-[#F4F6F8] p-4 rounded-lg space-y-2.5 text-xs"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Frage"
                      value={faqDraft.question}
                      onChange={(e) => setFaqDraft({ ...faqDraft, question: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded"
                    />
                    <textarea
                      rows={3}
                      required
                      placeholder="Antwort"
                      value={faqDraft.answer}
                      onChange={(e) => setFaqDraft({ ...faqDraft, answer: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="px-3 py-1.5 bg-[#171C22] text-white rounded">
                        Speichern
                      </button>
                      <button type="button" onClick={() => setFaqDraft(null)}>
                        Abbrechen
                      </button>
                    </div>
                  </form>
                )}

                <div className="divide-y divide-slate-100 text-xs">
                  {faqs.map((f) => (
                    <div key={f.id} className="py-2.5 flex justify-between items-center gap-2">
                      <span className="font-medium text-[#171C22] truncate">{f.question}</span>
                      <div className="space-x-2 shrink-0">
                        <button type="button" onClick={() => setFaqDraft(f)} className="text-[#1677FF]">
                          Bearbeiten
                        </button>
                        <button type="button" onClick={() => adminDeleteFaq(f.id)} className="text-rose-600">
                          Löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. SEO HEALTH AUDIT */}
        {tab === 'seo' && (
          <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[#171C22]">
                  Deutscher SEO-Health-Audit
                </h2>
                <p className="text-xs text-slate-500">
                  Prüft automatisch SEO-Titel, Meta-Beschreibungen, doppelte Slugs, Alt-Texte und Focus-Keywords. Sitemap unter /sitemap.xml und robots.txt aktiv.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded">
                <CheckCircle2 className="w-4 h-4" />
                {seoAuditIssues.length === 0
                  ? 'Keine Probleme gefunden'
                  : `${seoAuditIssues.length} Optimierungshinweise`}
              </span>
            </div>

            {seoAuditIssues.length === 0 ? (
              <p className="text-sm text-emerald-700">
                Alle Produkte, Kategorien und Ratgeber-Artikel erfüllen die definierten SEO-Richtlinien.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-sm">
                {seoAuditIssues.map((issue, idx) => (
                  <div key={idx} className="py-3 flex flex-wrap justify-between gap-2">
                    <div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded mr-2 ${
                          issue.type === 'Warnung'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {issue.type}
                      </span>
                      <span className="font-semibold text-[#171C22]">{issue.entity}</span>
                    </div>
                    <span className="text-slate-600 text-xs">{issue.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 9. AUDIT LOGS */}
        {tab === 'audit' && (
          <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-display text-lg font-bold text-[#171C22] mb-4">
              Administrator Audit-Protokoll
            </h2>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-slate-500">
                Noch keine protokollierten Admin-Änderungen in dieser Sitzung.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-3 flex flex-wrap justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-[#171C22] mr-2">{log.action}</span>
                      <span className="text-slate-700">{log.summary}</span>
                    </div>
                    <span className="text-slate-500 tabular-nums">
                      {log.adminEmail} · {formatDateDe(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
