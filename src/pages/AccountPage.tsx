import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Heart,
  LogIn,
  LogOut,
  MapPin,
  Package,
  RotateCcw,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import type { Address } from '../types/store';
import { createSafeId, formatDateDe, formatEur } from '../utils/format';
import { downloadOrderInvoicePdf } from '../utils/invoicePdf';
import { applySeoMetadata } from '../utils/seo';

export function AccountPage() {
  const {
    authReady,
    firebaseUser,
    userProfile,
    isAdmin,
    signInWithGoogle,
    logout,
    updateUserProfile,
    orders,
    requestOrderReturn,
    wishlistIds,
    products,
    settings,
    navigate,
  } = useStore();

  const [tab, setTab] = useState<'orders' | 'profile' | 'wishlist'>('orders');
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [street, setStreet] = useState(userProfile?.addresses?.[0]?.street || '');
  const [postalCode, setPostalCode] = useState(userProfile?.addresses?.[0]?.postalCode || '');
  const [city, setCity] = useState(userProfile?.addresses?.[0]?.city || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');

  useEffect(() => {
    applySeoMetadata({
      title: `Kundenkonto | ${settings.brandName}`,
      description: 'Bestellungen einsehen, Rechnungen herunterladen, Lieferadressen und Wunschliste verwalten.',
      canonicalPath: '/konto',
      noindex: true,
      siteName: settings.brandName,
    });
  }, [settings.brandName]);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhone(userProfile.phone || '');
      setStreet(userProfile.addresses?.[0]?.street || '');
      setPostalCode(userProfile.addresses?.[0]?.postalCode || '');
      setCity(userProfile.addresses?.[0]?.city || '');
    }
  }, [userProfile]);

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds]
  );

  const myOrders = useMemo(() => {
    if (!firebaseUser) return orders;
    if (isAdmin) return orders.filter((o) => o.userId === firebaseUser.uid || o.userId === 'guest');
    return orders;
  }, [orders, firebaseUser, isAdmin]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const parts = displayName.trim().split(' ');
    const addr: Address = {
      id: userProfile?.addresses?.[0]?.id || createSafeId('addr'),
      label: 'Standardadresse',
      firstName: parts[0] || 'Kunde',
      lastName: parts.slice(1).join(' ') || '',
      street: street.trim(),
      postalCode: postalCode.trim(),
      city: city.trim(),
      country: 'Deutschland',
      isDefault: true,
    };
    await updateUserProfile({
      displayName: displayName.trim(),
      phone: phone.trim(),
      addresses: street.trim() ? [addr] : userProfile?.addresses || [],
    });
    setSavingProfile(false);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrderId || !returnReason.trim()) return;
    await requestOrderReturn(returnOrderId, returnReason.trim());
    setReturnOrderId(null);
    setReturnReason('');
  };

  return (
    <main className="bg-[#F4F6F8] min-h-[75vh] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1677FF]">
              Persönlicher Bereich
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#171C22]">
              {firebaseUser ? `Hallo, ${firebaseUser.displayName || firebaseUser.email}` : 'Ihr Kundenkonto'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {firebaseUser
                ? `Angemeldet als ${firebaseUser.email}`
                : 'Melden Sie sich mit Google an, um Ihre Bestellungen und Merkliste geräteübergreifend zu synchronisieren.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#1677FF] text-white text-sm font-semibold rounded-md hover:bg-[#1262d4] transition-colors whitespace-nowrap shrink-0"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </button>
            )}
            {authReady && !firebaseUser ? (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#171C22] text-white text-sm font-semibold rounded-md hover:bg-[#1677FF] transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-4 h-4" />
                Mit Google anmelden
              </button>
            ) : (
              firebaseUser && (
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-md hover:border-[#171C22] transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                  Abmelden
                </button>
              )
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex gap-2 border-b border-slate-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('orders')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              tab === 'orders'
                ? 'border-[#1677FF] text-[#171C22]'
                : 'border-transparent text-slate-500 hover:text-[#171C22]'
            }`}
          >
            <Package className="w-4 h-4" />
            Bestellungen ({myOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('wishlist')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              tab === 'wishlist'
                ? 'border-[#1677FF] text-[#171C22]'
                : 'border-transparent text-slate-500 hover:text-[#171C22]'
            }`}
          >
            <Heart className="w-4 h-4" />
            Wunschliste ({wishlistProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              tab === 'profile'
                ? 'border-[#1677FF] text-[#171C22]'
                : 'border-transparent text-slate-500 hover:text-[#171C22]'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Profildaten & Adresse
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'orders' && (
          <section className="mt-6 space-y-4">
            {myOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <Package className="w-9 h-9 text-slate-400 mx-auto" />
                <p className="mt-3 text-sm text-slate-600">
                  Es liegen aktuell keine Bestellungen vor.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="mt-4 px-5 py-2.5 bg-[#171C22] text-white text-sm font-semibold rounded-md"
                >
                  Jetzt E-Bikes entdecken
                </button>
              </div>
            ) : (
              myOrders.map((order) => (
                <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <p className="font-mono text-sm font-bold text-[#171C22]">
                        Bestellung {order.orderNumber}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDateDe(order.createdAt)} · Zahlungsart: {order.paymentProvider}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="px-2.5 py-1 rounded bg-slate-100 text-[#171C22]">
                        Status: {order.orderStatus.toUpperCase()}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded ${
                          order.paymentStatus === 'verified'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        Zahlung: {order.paymentStatus.toUpperCase()}
                      </span>
                      <span className="text-base font-bold text-[#171C22] tabular-nums ml-2">
                        {formatEur(order.totalEur)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span>
                          {item.quantity} × {item.brand} {item.name} ({item.color}, Rahmen {item.frameSize})
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatEur(item.unitPriceEur * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.trackingNumber && (
                    <p className="mt-3 text-xs text-[#1677FF] font-medium">
                      Sendungsverfolgung ({order.shippingCarrier || 'Spedition'}): {order.trackingNumber}
                    </p>
                  )}

                  {order.returnRequested && (
                    <p className="mt-3 text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded">
                      Rückgabe / Widerruf angefragt: {order.returnReason}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => downloadOrderInvoicePdf(order, settings)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#171C22] text-white rounded-md hover:bg-[#1677FF] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Rechnung (PDF)
                    </button>
                    {!order.returnRequested && order.orderStatus !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => setReturnOrderId(order.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-slate-200 text-slate-700 rounded-md hover:border-[#171C22]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Rückgabe / Widerruf anfragen
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {tab === 'wishlist' && (
          <section className="mt-6">
            {wishlistProducts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <Heart className="w-9 h-9 text-slate-400 mx-auto" />
                <p className="mt-3 text-sm text-slate-600">
                  Sie haben noch keine E-Bikes auf Ihrer Wunschliste gespeichert.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'profile' && (
          <section className="mt-6 bg-white border border-slate-200 rounded-xl p-6 max-w-2xl">
            {!firebaseUser ? (
              <div className="text-center py-6">
                <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="mt-2 text-sm text-slate-600">
                  Bitte melden Sie sich an, um Ihre Lieferanschrift dauerhaft zu hinterlegen.
                </p>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="mt-4 px-5 py-2.5 bg-[#171C22] text-white text-sm font-semibold rounded-md"
                >
                  Mit Google anmelden
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h2 className="font-display text-lg font-bold text-[#171C22]">
                  Kontodaten & Standardlieferadresse
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Telefonnummer
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Straße & Hausnummer
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">PLZ</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Stadt</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 bg-[#171C22] text-white text-sm font-semibold rounded-md hover:bg-[#1677FF] transition-colors"
                >
                  {savingProfile ? 'Wird gespeichert...' : 'Profil speichern'}
                </button>
              </form>
            )}
          </section>
        )}

        {/* Return Request Modal */}
        {returnOrderId && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <form
              onSubmit={handleReturnSubmit}
              className="bg-white rounded-xl p-6 max-w-md w-full space-y-4"
            >
              <h3 className="font-display text-lg font-bold text-[#171C22]">
                Rückgabe oder Widerruf anfragen
              </h3>
              <p className="text-xs text-slate-600">
                Bitte teilen Sie uns kurz den Grund mit (z. B. Widerruf innerhalb von 14 Tagen oder Transportschaden).
              </p>
              <textarea
                required
                rows={3}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Ihr Anliegen..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnOrderId(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#171C22] text-white rounded-md"
                >
                  Anfrage senden
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
