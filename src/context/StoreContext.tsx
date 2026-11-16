import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  DEFAULT_SITE_SETTINGS,
  DEMO_BLOG_POSTS,
  DEMO_BRANDS,
  DEMO_CATEGORIES,
  DEMO_COUPONS,
  DEMO_FAQS,
  DEMO_PRODUCTS,
  DEMO_REVIEWS,
  DEMO_TESTIMONIALS,
} from '../data/seedData';
import { translations } from '../i18n/translations';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import type {
  Address,
  AuditLog,
  BlogPost,
  Brand,
  CartItem,
  Category,
  CookieConsentState,
  Coupon,
  Enquiry,
  Faq,
  Language,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  Review,
  SiteSettings,
  Testimonial,
  UserProfile,
} from '../types/store';
import {
  activateConsentGatedScripts,
  getStoredCookieConsent,
  saveCookieConsent,
  trackConversionEvent,
} from '../utils/analytics';
import { createSafeId } from '../utils/format';

interface PublicConfig {
  mapsApiKey: string;
  stripeConfigured: boolean;
  mollieConfigured: boolean;
  resendConfigured: boolean;
}

interface ToastMessage {
  id: string;
  text: string;
  tone: 'info' | 'success' | 'error';
}

interface StoreContextValue {
  currentPath: string;
  navigate: (path: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;

  // Auth & Profile
  authReady: boolean;
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (patch: { displayName?: string; phone?: string; addresses?: Address[] }) => Promise<void>;

  // Catalog & CMS
  settings: SiteSettings;
  categories: Category[];
  brands: Brand[];
  products: Product[];
  coupons: Coupon[];
  reviews: Review[];
  blogPosts: BlogPost[];
  faqs: Faq[];
  testimonials: Testimonial[];
  firestoreSeeded: boolean;
  seedFirestoreWithDemoData: () => Promise<void>;

  // Cart & Checkout
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, color: string, frameSize: string, qty?: number) => void;
  updateCartQty: (productId: string, color: string, frameSize: string, qty: number) => void;
  removeFromCart: (productId: string, color: string, frameSize: string) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCouponCode: (code: string) => Promise<{ ok: boolean; message: string }>;
  removeCoupon: () => void;
  cartSubtotal: number;
  cartDiscount: number;
  cartShipping: number;
  cartTotal: number;
  cartCount: number;

  // Wishlist, Compare, Recently Viewed, Quick View
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  compareIds: string[];
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
  recentProductIds: string[];
  recordProductView: (productId: string) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;

  // Orders & Reviews
  orders: Order[];
  createOrderRecord: (order: Order) => Promise<void>;
  requestOrderReturn: (orderId: string, reason: string) => Promise<void>;
  submitReview: (input: {
    productId: string;
    rating: number;
    title: string;
    comment: string;
  }) => Promise<void>;

  // Enquiries & Newsletter
  enquiries: Enquiry[];
  submitEnquiry: (input: {
    type: 'contact' | 'stock_alert' | 'newsletter';
    name?: string;
    email: string;
    phone?: string;
    subject?: string;
    message?: string;
    productId?: string;
    productName?: string;
  }) => Promise<{ ok: boolean; message: string }>;

  // Admin Operations
  auditLogs: AuditLog[];
  adminSaveProduct: (product: Product) => Promise<void>;
  adminDeleteProduct: (productId: string) => Promise<void>;
  adminSaveCategory: (cat: Category) => Promise<void>;
  adminDeleteCategory: (catId: string) => Promise<void>;
  adminSaveBrand: (brand: Brand) => Promise<void>;
  adminDeleteBrand: (brandId: string) => Promise<void>;
  adminSaveSettings: (next: SiteSettings) => Promise<void>;
  adminSaveBlogPost: (post: BlogPost) => Promise<void>;
  adminDeleteBlogPost: (postId: string) => Promise<void>;
  adminSaveFaq: (faq: Faq) => Promise<void>;
  adminDeleteFaq: (faqId: string) => Promise<void>;
  adminSaveTestimonial: (item: Testimonial) => Promise<void>;
  adminDeleteTestimonial: (id: string) => Promise<void>;
  adminSaveCoupon: (coupon: Coupon) => Promise<void>;
  adminDeleteCoupon: (id: string) => Promise<void>;
  adminUpdateOrder: (
    orderId: string,
    patch: {
      orderStatus?: OrderStatus;
      paymentStatus?: PaymentStatus;
      trackingNumber?: string;
      shippingCarrier?: string;
    }
  ) => Promise<void>;
  adminUpdateEnquiryStatus: (id: string, status: 'new' | 'replied' | 'closed') => Promise<void>;

  // Public config, Cookie Consent, Toast
  publicConfig: PublicConfig;
  cookieConsent: CookieConsentState | null;
  updateCookieConsent: (analytics: boolean, marketing: boolean) => void;
  openCookieSettings: boolean;
  setOpenCookieSettings: (open: boolean) => void;
  toasts: ToastMessage[];
  pushToast: (text: string, tone?: 'info' | 'success' | 'error') => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_KEY = 'emotion_bikes_cart_v1';
const WISHLIST_KEY = 'emotion_bikes_wishlist_v1';
const COMPARE_KEY = 'emotion_bikes_compare_v1';
const RECENT_KEY = 'emotion_bikes_recent_v1';
const GUEST_ORDERS_KEY = 'emotion_bikes_guest_orders_v1';
const LANG_KEY = 'emotion_bikes_lang_v1';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [language, setLanguageState] = useState<Language>(() =>
    readStorage<Language>(LANG_KEY, 'de')
  );

  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdminDocMember, setIsAdminDocMember] = useState(false);

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(DEMO_BRANDS);
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [coupons, setCoupons] = useState<Coupon[]>(DEMO_COUPONS);
  const [reviews, setReviews] = useState<Review[]>(DEMO_REVIEWS);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(DEMO_BLOG_POSTS);
  const [faqs, setFaqs] = useState<Faq[]>(DEMO_FAQS);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEMO_TESTIMONIALS);
  const [firestoreSeeded, setFirestoreSeeded] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => readStorage<CartItem[]>(CART_KEY, []));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const [wishlistIds, setWishlistIds] = useState<string[]>(() =>
    readStorage<string[]>(WISHLIST_KEY, [])
  );
  const [compareIds, setCompareIds] = useState<string[]>(() =>
    readStorage<string[]>(COMPARE_KEY, [])
  );
  const [recentProductIds, setRecentProductIds] = useState<string[]>(() =>
    readStorage<string[]>(RECENT_KEY, [])
  );
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const [orders, setOrders] = useState<Order[]>(() => readStorage<Order[]>(GUEST_ORDERS_KEY, []));
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [publicConfig, setPublicConfig] = useState<PublicConfig>({
    mapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    stripeConfigured: false,
    mollieConfigured: false,
    resendConfigured: false,
  });

  const [cookieConsent, setCookieConsent] = useState<CookieConsentState | null>(() =>
    getStoredCookieConsent()
  );
  const [openCookieSettings, setOpenCookieSettings] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((text: string, tone: 'info' | 'success' | 'error' = 'info') => {
    const id = createSafeId('toast');
    setToasts((prev) => [...prev.slice(-3), { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3800);
  }, []);

  const navigate = useCallback((path: string) => {
    if (path === window.location.pathname + window.location.search) return;
    window.history.pushState({}, '', path);
    setCurrentPath(path.split('?')[0] || '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePop = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    writeStorage(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback(
    (key: string) => translations[language]?.[key] ?? translations.de[key] ?? key,
    [language]
  );

  // Persist local collections
  useEffect(() => writeStorage(CART_KEY, cart), [cart]);
  useEffect(() => writeStorage(WISHLIST_KEY, wishlistIds), [wishlistIds]);
  useEffect(() => writeStorage(COMPARE_KEY, compareIds), [compareIds]);
  useEffect(() => writeStorage(RECENT_KEY, recentProductIds), [recentProductIds]);

  // Fetch public server config
  useEffect(() => {
    fetch('/api/public-config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setPublicConfig((prev) => ({
            mapsApiKey: data.mapsApiKey || prev.mapsApiKey,
            stripeConfigured: Boolean(data.stripeConfigured),
            mollieConfigured: Boolean(data.mollieConfigured),
            resendConfigured: Boolean(data.resendConfigured),
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Activate consent-gated analytics when consent exists
  useEffect(() => {
    if (cookieConsent) {
      activateConsentGatedScripts(cookieConsent, settings);
    }
  }, [cookieConsent, settings]);

  const updateCookieConsent = useCallback(
    (analytics: boolean, marketing: boolean) => {
      const next: CookieConsentState = {
        essential: true,
        analytics,
        marketing,
        decidedAt: new Date().toISOString(),
      };
      saveCookieConsent(next);
      setCookieConsent(next);
      setOpenCookieSettings(false);
      activateConsentGatedScripts(next, settings);
      pushToast(
        language === 'de'
          ? 'Datenschutzeinstellungen gespeichert.'
          : 'Privacy preferences saved.',
        'success'
      );
    },
    [settings, language, pushToast]
  );

  const isAdmin = useMemo(() => {
    if (!firebaseUser || !firebaseUser.emailVerified) return false;
    return firebaseUser.email === BOOTSTRAPPED_ADMIN_EMAIL || isAdminDocMember;
  }, [firebaseUser, isAdminDocMember]);

  // Load public storefront data from Firestore (with immediate Demo seed fallback)
  const loadPublicStoreData = useCallback(async () => {
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'site'));
      if (settingsSnap.exists()) {
        setSettings({ ...DEFAULT_SITE_SETTINGS, ...(settingsSnap.data() as SiteSettings) });
        setFirestoreSeeded(true);
      }
    } catch {
      // Keep default settings if unseeded
    }

    try {
      const catSnap = await getDocs(collection(db, 'categories'));
      if (!catSnap.empty) {
        const list = catSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }))
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setCategories(list);
      }
    } catch {
      // fallback to DEMO_CATEGORIES
    }

    try {
      const brandSnap = await getDocs(collection(db, 'brands'));
      if (!brandSnap.empty) {
        setBrands(brandSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Brand, 'id'>) })));
      }
    } catch {
      // fallback
    }

    try {
      const prodQuery = query(collection(db, 'products'), where('published', '==', true));
      const prodSnap = await getDocs(prodQuery);
      if (!prodSnap.empty) {
        setProducts(
          prodSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }))
        );
        setFirestoreSeeded(true);
      }
    } catch {
      // fallback
    }

    try {
      const revSnap = await getDocs(collection(db, 'reviews'));
      if (!revSnap.empty) {
        setReviews(revSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) })));
      }
    } catch {
      // fallback
    }

    try {
      const blogQuery = query(collection(db, 'blogPosts'), where('published', '==', true));
      const blogSnap = await getDocs(blogQuery);
      if (!blogSnap.empty) {
        setBlogPosts(
          blogSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) }))
        );
      }
    } catch {
      // fallback
    }

    try {
      const faqSnap = await getDocs(collection(db, 'faqs'));
      if (!faqSnap.empty) {
        setFaqs(
          faqSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<Faq, 'id'>) }))
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        );
      }
    } catch {
      // fallback
    }

    try {
      const testSnap = await getDocs(collection(db, 'testimonials'));
      if (!testSnap.empty) {
        setTestimonials(
          testSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Testimonial, 'id'>) }))
        );
      }
    } catch {
      // fallback
    }

    try {
      const couponQuery = query(collection(db, 'coupons'), where('active', '==', true));
      const couponSnap = await getDocs(couponQuery);
      if (!couponSnap.empty) {
        setCoupons(
          couponSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Coupon, 'id'>) }))
        );
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    loadPublicStoreData();
  }, [loadPublicStoreData]);

  // Listen to Firebase Auth state & sync private user/admin/orders
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);

      if (!user) {
        setUserProfile(null);
        setIsAdminDocMember(false);
        setOrders(readStorage<Order[]>(GUEST_ORDERS_KEY, []));
        setEnquiries([]);
        setAuditLogs([]);
        return;
      }

      // Check admin membership
      let adminFlag = user.email === BOOTSTRAPPED_ADMIN_EMAIL && user.emailVerified;
      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          adminFlag = true;
          setIsAdminDocMember(true);
        }
      } catch {
        setIsAdminDocMember(false);
      }

      // Upsert/Load user profile
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setUserProfile(data);
          if (Array.isArray(data.wishlist) && data.wishlist.length > 0) {
            setWishlistIds((prev) => Array.from(new Set([...prev, ...data.wishlist])));
          }
        } else if (user.emailVerified) {
          const now = new Date().toISOString();
          const freshProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Kunde',
            phone: '',
            addresses: [],
            wishlist: readStorage<string[]>(WISHLIST_KEY, []),
            createdAt: now,
            updatedAt: now,
          };
          await setDoc(userRef, freshProfile);
          setUserProfile(freshProfile);
        }
      } catch (err) {
        console.warn('Profile sync warning:', err);
      }

      // Load orders (all for admin, own for customer)
      try {
        const ordersRef = collection(db, 'orders');
        const q = adminFlag
          ? query(ordersRef, orderBy('createdAt', 'desc'))
          : query(ordersRef, where('userId', '==', user.uid));
        const orderSnap = await getDocs(q);
        const remoteOrders = orderSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Order, 'id'>),
        }));
        remoteOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const localGuest = readStorage<Order[]>(GUEST_ORDERS_KEY, []);
        const merged = [...remoteOrders];
        localGuest.forEach((g) => {
          if (!merged.some((m) => m.orderNumber === g.orderNumber)) {
            merged.push(g);
          }
        });
        setOrders(merged);
      } catch (err) {
        console.warn('Orders fetch warning:', err);
      }

      // Admin-only collections
      if (adminFlag) {
        try {
          const allProdSnap = await getDocs(collection(db, 'products'));
          if (!allProdSnap.empty) {
            setProducts(
              allProdSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }))
            );
          }
          const allBlogSnap = await getDocs(collection(db, 'blogPosts'));
          if (!allBlogSnap.empty) {
            setBlogPosts(
              allBlogSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) }))
            );
          }
          const allCouponSnap = await getDocs(collection(db, 'coupons'));
          if (!allCouponSnap.empty) {
            setCoupons(
              allCouponSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Coupon, 'id'>) }))
            );
          }
          const enqSnap = await getDocs(collection(db, 'enquiries'));
          setEnquiries(
            enqSnap.docs
              .map((d) => ({ id: d.id, ...(d.data() as Omit<Enquiry, 'id'>) }))
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          );
          const logSnap = await getDocs(collection(db, 'auditLogs'));
          setAuditLogs(
            logSnap.docs
              .map((d) => ({ id: d.id, ...(d.data() as Omit<AuditLog, 'id'>) }))
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          );
        } catch (err) {
          console.warn('Admin collections fetch warning:', err);
        }
      }
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
      pushToast(
        language === 'de' ? 'Erfolgreich angemeldet.' : 'Signed in successfully.',
        'success'
      );
    } catch (err) {
      pushToast(
        language === 'de'
          ? 'Anmeldung abgebrochen oder fehlgeschlagen.'
          : 'Sign-in cancelled or failed.',
        'error'
      );
      console.error(err);
    }
  }, [language, pushToast]);

  const logout = useCallback(async () => {
    await signOut(auth);
    pushToast(language === 'de' ? 'Abgemeldet.' : 'Signed out.', 'info');
  }, [language, pushToast]);

  const updateUserProfile = useCallback(
    async (patch: { displayName?: string; phone?: string; addresses?: Address[] }) => {
      if (!firebaseUser || !userProfile) return;
      const updatedAt = new Date().toISOString();
      const next: UserProfile = {
        ...userProfile,
        ...patch,
        updatedAt,
      };
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          ...patch,
          updatedAt,
        });
        setUserProfile(next);
        pushToast('Kontodaten aktualisiert.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
      }
    },
    [firebaseUser, userProfile, pushToast]
  );

  // Cart Calculations
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.priceEur * item.quantity, 0),
    [cart]
  );

  const cartDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (cartSubtotal < appliedCoupon.minPurchaseEur) return 0;
    if (appliedCoupon.type === 'percent') {
      return Math.round((cartSubtotal * appliedCoupon.value) / 100);
    }
    if (appliedCoupon.type === 'fixed') {
      return Math.min(cartSubtotal, appliedCoupon.value);
    }
    return 0;
  }, [appliedCoupon, cartSubtotal]);

  const cartShipping = useMemo(() => {
    if (cart.length === 0) return 0;
    if (appliedCoupon?.type === 'free_shipping' && cartSubtotal >= appliedCoupon.minPurchaseEur) {
      return 0;
    }
    return cartSubtotal - cartDiscount >= settings.freeShippingThresholdEur
      ? 0
      : settings.standardShippingEur;
  }, [cart.length, appliedCoupon, cartSubtotal, cartDiscount, settings]);

  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + cartShipping);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const addToCart = useCallback(
    (product: Product, color: string, frameSize: string, qty = 1) => {
      if (product.stock <= 0) {
        pushToast('Dieses Modell ist aktuell leider ausverkauft.', 'error');
        return;
      }
      setCart((prev) => {
        const idx = prev.findIndex(
          (i) => i.productId === product.id && i.color === color && i.frameSize === frameSize
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantity: Math.min(product.stock, updated[idx].quantity + qty),
          };
          return updated;
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            sku: product.sku,
            image: product.images[0] || '',
            priceEur: product.priceEur,
            color,
            frameSize,
            quantity: Math.min(product.stock, qty),
            maxStock: product.stock,
            isSPedelec: product.isSPedelec,
          },
        ];
      });
      trackConversionEvent('add_to_cart', {
        currency: 'EUR',
        value: product.priceEur * qty,
        items: [{ item_id: product.sku, item_name: product.name, price: product.priceEur, quantity: qty }],
      });
      setIsCartOpen(true);
      pushToast(`${product.brand} ${product.name} zum Warenkorb hinzugefügt.`, 'success');
    },
    [pushToast]
  );

  const updateCartQty = useCallback(
    (productId: string, color: string, frameSize: string, qty: number) => {
      if (qty <= 0) {
        setCart((prev) =>
          prev.filter(
            (i) => !(i.productId === productId && i.color === color && i.frameSize === frameSize)
          )
        );
        return;
      }
      setCart((prev) =>
        prev.map((i) =>
          i.productId === productId && i.color === color && i.frameSize === frameSize
            ? { ...i, quantity: Math.min(i.maxStock, qty) }
            : i
        )
      );
    },
    []
  );

  const removeFromCart = useCallback((productId: string, color: string, frameSize: string) => {
    setCart((prev) =>
      prev.filter(
        (i) => !(i.productId === productId && i.color === color && i.frameSize === frameSize)
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
  }, []);

  const applyCouponCode = useCallback(
    async (rawCode: string): Promise<{ ok: boolean; message: string }> => {
      const code = rawCode.trim().toUpperCase();
      if (!code) return { ok: false, message: 'Bitte Gutscheincode eingeben.' };

      const localFound = coupons.find((c) => c.code.toUpperCase() === code && c.active);
      if (localFound) {
        if (cartSubtotal < localFound.minPurchaseEur) {
          return {
            ok: false,
            message: `Mindestbestellwert ${localFound.minPurchaseEur} € nicht erreicht.`,
          };
        }
        setAppliedCoupon(localFound);
        return { ok: true, message: `Gutschein ${localFound.code} angewendet.` };
      }

      try {
        const resp = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, subtotalEur: cartSubtotal }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          return { ok: false, message: data.error || 'Gutschein ungültig.' };
        }
        setAppliedCoupon(data.coupon);
        return { ok: true, message: `Gutschein ${data.coupon.code} angewendet.` };
      } catch {
        return { ok: false, message: 'Gutschein konnte nicht geprüft werden.' };
      }
    },
    [coupons, cartSubtotal]
  );

  const removeCoupon = useCallback(() => setAppliedCoupon(null), []);

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlistIds((prev) => {
        const exists = prev.includes(productId);
        const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
        if (firebaseUser && firebaseUser.emailVerified) {
          updateDoc(doc(db, 'users', firebaseUser.uid), {
            wishlist: next,
            updatedAt: new Date().toISOString(),
          }).catch(() => {});
        }
        pushToast(
          exists ? 'Von der Wunschliste entfernt.' : 'Auf der Wunschliste gespeichert.',
          'info'
        );
        return next;
      });
    },
    [firebaseUser, pushToast]
  );

  const toggleCompare = useCallback(
    (productId: string) => {
      setCompareIds((prev) => {
        if (prev.includes(productId)) {
          return prev.filter((id) => id !== productId);
        }
        if (prev.length >= 4) {
          pushToast('Maximal 4 E-Bikes gleichzeitig vergleichbar.', 'error');
          return prev;
        }
        pushToast('Zum Modellvergleich hinzugefügt.', 'success');
        return [...prev, productId];
      });
    },
    [pushToast]
  );

  const clearCompare = useCallback(() => setCompareIds([]), []);

  const recordProductView = useCallback((productId: string) => {
    setRecentProductIds((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 6));
  }, []);

  const logAdminAction = useCallback(
    async (action: string, targetCollection: string, summary: string, targetId?: string) => {
      if (!firebaseUser || !isAdmin) return;
      const entry: AuditLog = {
        id: createSafeId('audit'),
        adminUid: firebaseUser.uid,
        adminEmail: firebaseUser.email || '',
        action,
        targetCollection,
        targetId,
        summary,
        createdAt: new Date().toISOString(),
      };
      setAuditLogs((prev) => [entry, ...prev]);
      try {
        await setDoc(doc(db, 'auditLogs', entry.id), {
          adminUid: entry.adminUid,
          adminEmail: entry.adminEmail,
          action: entry.action,
          targetCollection: entry.targetCollection,
          targetId: entry.targetId || '',
          summary: entry.summary,
          createdAt: entry.createdAt,
        });
      } catch (err) {
        console.warn('Audit log write warning:', err);
      }
    },
    [firebaseUser, isAdmin]
  );

  const seedFirestoreWithDemoData = useCallback(async () => {
    if (!isAdmin) {
      pushToast('Nur für Administratoren verfügbar.', 'error');
      return;
    }
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'settings', 'site'), {
        ...DEFAULT_SITE_SETTINGS,
        updatedAt: new Date().toISOString(),
      });
      DEMO_CATEGORIES.forEach((c) => {
        const { id, ...rest } = c;
        batch.set(doc(db, 'categories', id), rest);
      });
      DEMO_BRANDS.forEach((b) => {
        const { id, ...rest } = b;
        batch.set(doc(db, 'brands', id), rest);
      });
      DEMO_PRODUCTS.forEach((p) => {
        const { id, ...rest } = p;
        batch.set(doc(db, 'products', id), { ...rest, updatedAt: new Date().toISOString() });
      });
      DEMO_COUPONS.forEach((c) => {
        const { id, ...rest } = c;
        batch.set(doc(db, 'coupons', id), rest);
      });
      DEMO_REVIEWS.forEach((r) => {
        const { id, ...rest } = r;
        batch.set(doc(db, 'reviews', id), rest);
      });
      DEMO_BLOG_POSTS.forEach((b) => {
        const { id, ...rest } = b;
        batch.set(doc(db, 'blogPosts', id), rest);
      });
      DEMO_FAQS.forEach((f) => {
        const { id, ...rest } = f;
        batch.set(doc(db, 'faqs', id), rest);
      });
      DEMO_TESTIMONIALS.forEach((tItem) => {
        const { id, ...rest } = tItem;
        batch.set(doc(db, 'testimonials', id), rest);
      });
      await batch.commit();
      setFirestoreSeeded(true);
      await loadPublicStoreData();
      await logAdminAction('SEED_DEMO_DATA', 'products', 'Musterkatalog & Inhalte in Firestore gespeichert');
      pushToast('Demo-Katalog erfolgreich in Firestore gespeichert!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch-seed');
    }
  }, [isAdmin, loadPublicStoreData, logAdminAction, pushToast]);

  const createOrderRecord = useCallback(
    async (order: Order) => {
      setOrders((prev) => [order, ...prev]);
      const guestOrders = readStorage<Order[]>(GUEST_ORDERS_KEY, []);
      writeStorage(GUEST_ORDERS_KEY, [order, ...guestOrders]);

      if (firebaseUser && firebaseUser.emailVerified) {
        try {
          const { id, ...rest } = order;
          // Respect security rule: client creates order with pending first, or admin writes verified directly
          await setDoc(doc(db, 'orders', id), {
            ...rest,
            paymentStatus: isAdmin ? order.paymentStatus : 'pending',
            orderStatus: isAdmin ? order.orderStatus : 'pending',
          });
        } catch (err) {
          console.warn('Firestore order persistence warning:', err);
        }
      }
    },
    [firebaseUser, isAdmin]
  );

  const requestOrderReturn = useCallback(
    async (orderId: string, reason: string) => {
      const updatedAt = new Date().toISOString();
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, returnRequested: true, returnReason: reason, updatedAt } : o
        )
      );
      if (firebaseUser && firebaseUser.emailVerified) {
        try {
          await updateDoc(doc(db, 'orders', orderId), {
            returnRequested: true,
            returnReason: reason,
            updatedAt,
          });
        } catch (err) {
          console.warn('Return request Firestore warning:', err);
        }
      }
      pushToast('Rückgabeanfrage übermittelt.', 'success');
    },
    [firebaseUser, pushToast]
  );

  const submitReview = useCallback(
    async (input: { productId: string; rating: number; title: string; comment: string }) => {
      if (!firebaseUser || !firebaseUser.emailVerified) {
        pushToast('Bitte melden Sie sich an, um eine Bewertung zu schreiben.', 'error');
        return;
      }
      const id = createSafeId('rev');
      const review: Review = {
        id,
        productId: input.productId,
        userId: firebaseUser.uid,
        authorName: firebaseUser.displayName || 'Verifizierter Kunde',
        rating: input.rating,
        title: input.title,
        comment: input.comment,
        verifiedPurchase: false,
        isDemoData: false,
        createdAt: new Date().toISOString(),
      };
      setReviews((prev) => [review, ...prev]);
      try {
        const { id: _omit, ...rest } = review;
        await setDoc(doc(db, 'reviews', id), rest);
        pushToast('Vielen Dank für Ihre Bewertung!', 'success');
      } catch (err) {
        console.warn('Review Firestore save warning:', err);
        pushToast('Bewertung lokal gespeichert.', 'info');
      }
    },
    [firebaseUser, pushToast]
  );

  const submitEnquiry = useCallback(
    async (input: {
      type: 'contact' | 'stock_alert' | 'newsletter';
      name?: string;
      email: string;
      phone?: string;
      subject?: string;
      message?: string;
      productId?: string;
      productName?: string;
    }): Promise<{ ok: boolean; message: string }> => {
      try {
        const resp = await fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await resp.json();
        if (!resp.ok) {
          return { ok: false, message: data.error || 'Anfrage fehlgeschlagen.' };
        }
        const entry: Enquiry = {
          id: createSafeId('enq'),
          type: input.type,
          userId: firebaseUser?.uid || 'guest',
          name: input.name || '',
          email: input.email,
          phone: input.phone || '',
          subject: input.subject || '',
          message: input.message || '',
          productId: input.productId || '',
          productName: input.productName || '',
          status: 'new',
          createdAt: new Date().toISOString(),
        };
        setEnquiries((prev) => [entry, ...prev]);

        if (firebaseUser && firebaseUser.emailVerified) {
          const { id, ...rest } = entry;
          await setDoc(doc(db, 'enquiries', id), rest).catch(() => {});
        }

        if (input.type === 'newsletter') {
          trackConversionEvent('newsletter_signup', { method: 'footer_form' });
        } else if (input.type === 'contact') {
          trackConversionEvent('generate_lead', { lead_type: 'contact_form' });
        }

        return {
          ok: true,
          message:
            input.type === 'newsletter'
              ? 'Erfolgreich zum Newsletter angemeldet!'
              : input.type === 'stock_alert'
                ? 'Wir benachrichtigen Sie per E-Mail, sobald das Modell verfügbar ist.'
                : 'Ihre Anfrage wurde übermittelt. Wir melden uns kurzfristig.',
        };
      } catch {
        return { ok: false, message: 'Verbindungsfehler beim Senden.' };
      }
    },
    [firebaseUser]
  );

  // Admin CRUD handlers
  const adminSaveProduct = useCallback(
    async (product: Product) => {
      if (!isAdmin) return;
      const now = new Date().toISOString();
      const updated = { ...product, updatedAt: now };
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === updated.id);
        return exists ? prev.map((p) => (p.id === updated.id ? updated : p)) : [updated, ...prev];
      });
      const { id, ...rest } = updated;
      try {
        await setDoc(doc(db, 'products', id), rest);
        await logAdminAction('SAVE_PRODUCT', 'products', `Produkt gespeichert: ${product.name}`, id);
        pushToast(`Produkt „${product.name}“ gespeichert.`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `products/${id}`);
      }
    },
    [isAdmin, logAdminAction, pushToast]
  );

  const adminDeleteProduct = useCallback(
    async (productId: string) => {
      if (!isAdmin) return;
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      try {
        await deleteDoc(doc(db, 'products', productId));
        await logAdminAction('DELETE_PRODUCT', 'products', `Produkt gelöscht: ${productId}`, productId);
        pushToast('Produkt gelöscht.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
      }
    },
    [isAdmin, logAdminAction, pushToast]
  );

  const adminSaveCategory = useCallback(
    async (cat: Category) => {
      if (!isAdmin) return;
      setCategories((prev) => {
        const exists = prev.some((c) => c.id === cat.id);
        return exists ? prev.map((c) => (c.id === cat.id ? cat : c)) : [...prev, cat];
      });
      const { id, ...rest } = cat;
      try {
        await setDoc(doc(db, 'categories', id), rest);
        await logAdminAction('SAVE_CATEGORY', 'categories', `Kategorie gespeichert: ${cat.name}`, id);
        pushToast(`Kategorie „${cat.name}“ gespeichert.`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `categories/${id}`);
      }
    },
    [isAdmin, logAdminAction, pushToast]
  );

  const adminDeleteCategory = useCallback(
    async (catId: string) => {
      if (!isAdmin) return;
      setCategories((prev) => prev.filter((c) => c.id !== catId));
      try {
        await deleteDoc(doc(db, 'categories', catId));
        await logAdminAction('DELETE_CATEGORY', 'categories', `Kategorie gelöscht: ${catId}`, catId);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `categories/${catId}`);
      }
    },
    [isAdmin, logAdminAction]
  );

  const adminSaveBrand = useCallback(
    async (brand: Brand) => {
      if (!isAdmin) return;
      setBrands((prev) => {
        const exists = prev.some((b) => b.id === brand.id);
        return exists ? prev.map((b) => (b.id === brand.id ? brand : b)) : [...prev, brand];
      });
      const { id, ...rest } = brand;
      try {
        await setDoc(doc(db, 'brands', id), rest);
        await logAdminAction('SAVE_BRAND', 'brands', `Marke gespeichert: ${brand.name}`, id);
        pushToast(`Marke „${brand.name}“ gespeichert.`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `brands/${id}`);
      }
    },
    [isAdmin, logAdminAction, pushToast]
  );

  const adminDeleteBrand = useCallback(
    async (brandId: string) => {
      if (!isAdmin) return;
      setBrands((prev) => prev.filter((b) => b.id !== brandId));
      try {
        await deleteDoc(doc(db, 'brands', brandId));
        await logAdminAction('DELETE_BRAND', 'brands', `Marke gelöscht: ${brandId}`, brandId);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `brands/${brandId}`);
      }
    },
    [isAdmin, logAdminAction]
  );

  const adminSaveSettings = useCallback(
    async (next: SiteSettings) => {
      if (!isAdmin) return;
      const updated = { ...next, updatedAt: new Date().toISOString() };
      setSettings(updated);
      try {
        await setDoc(doc(db, 'settings', 'site'), updated);
        await logAdminAction('UPDATE_SETTINGS', 'settings', `Shop-Einstellungen & Marke (${updated.brandName}) aktualisiert`, 'site');
        pushToast('Shop-Einstellungen gespeichert.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'settings/site');
      }
    },
    [isAdmin, logAdminAction, pushToast]
  );

  const adminSaveBlogPost = useCallback(
    async (post: BlogPost) => {
      if (!isAdmin) return;
      setBlogPosts((prev) => {
        const exists = prev.some((b) => b.id === post.id);
        return exists ? prev.map((b) => (b.id === post.id ? post : b)) : [post, ...prev];
      });
      const { id, ...rest } = post;
      try {
        await setDoc(doc(db, 'blogPosts', id), rest);
        await logAdminAction('SAVE_BLOG', 'blogPosts', `Ratgeber-Artikel gespeichert: ${post.title}`, id);
        pushToast('Ratgeber-Artikel gespeichert.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `blogPosts/${id}`);
      }
    },
    [isAdmin, logAdminAction, pushToast]
  );

  const adminDeleteBlogPost = useCallback(
    async (postId: string) => {
      if (!isAdmin) return;
      setBlogPosts((prev) => prev.filter((b) => b.id !== postId));
      try {
        await deleteDoc(doc(db, 'blogPosts', postId));
        await logAdminAction('DELETE_BLOG', 'blogPosts', `Artikel gelöscht: ${postId}`, postId);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `blogPosts/${postId}`);
      }
    },
    [isAdmin, logAdminAction]
  );

  const adminSaveFaq = useCallback(
    async (faq: Faq) => {
      if (!isAdmin) return;
      setFaqs((prev) => {
        const exists = prev.some((f) => f.id === faq.id);
        return exists ? prev.map((f) => (f.id === faq.id ? faq : f)) : [...prev, faq];
      });
      const { id, ...rest } = faq;
      try {
        await setDoc(doc(db, 'faqs', id), rest);
        await logAdminAction('SAVE_FAQ', 'faqs', `FAQ gespeichert: ${faq.question.slice(0, 60)}`, id);
        pushToast('FAQ gespeichert.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `faqs/${id}`);
      }
    },
    [isAdmin, logAdminAction, pushToast]
  );

  const adminDeleteFaq = useCallback(
    async (faqId: string) => {
      if (!isAdmin) return;
      setFaqs((prev) => prev.filter((f) => f.id !== faqId));
      try {
        await deleteDoc(doc(db, 'faqs', faqId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `faqs/${faqId}`);
      }
    },
    [isAdmin]
  );

  const adminSaveTestimonial = useCallback(
    async (item: Testimonial) => {
      if (!isAdmin) return;
      setTestimonials((prev) => {
        const exists = prev.some((x) => x.id === item.id);
        return exists ? prev.map((x) => (x.id === item.id ? item : x)) : [...prev, item];
      });
      const { id, ...rest } = item;
      try {
        await setDoc(doc(db, 'testimonials', id), rest);
        pushToast('Kundenstimme gespeichert.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `testimonials/${id}`);
      }
    },
    [isAdmin, pushToast]
  );

  const adminDeleteTestimonial = useCallback(
    async (id: string) => {
      if (!isAdmin) return;
      setTestimonials((prev) => prev.filter((x) => x.id !== id));
      try {
        await deleteDoc(doc(db, 'testimonials', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `testimonials/${id}`);
      }
    },
    [isAdmin]
  );

  const adminSaveCoupon = useCallback(
    async (coupon: Coupon) => {
      if (!isAdmin) return;
      setCoupons((prev) => {
        const exists = prev.some((c) => c.id === coupon.id);
        return exists ? prev.map((c) => (c.id === coupon.id ? coupon : c)) : [coupon, ...prev];
      });
      const { id, ...rest } = coupon;
      try {
        await setDoc(doc(db, 'coupons', id), rest);
        await logAdminAction('SAVE_COUPON', 'coupons', `Gutschein gespeichert: ${coupon.code}`, id);
        pushToast(`Gutschein ${coupon.code} gespeichert.`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `coupons/${id}`);
      }
    },
    [isAdmin, logAdminAction, pushToast]
  );

  const adminDeleteCoupon = useCallback(
    async (id: string) => {
      if (!isAdmin) return;
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      try {
        await deleteDoc(doc(db, 'coupons', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `coupons/${id}`);
      }
    },
    [isAdmin]
  );

  const adminUpdateOrder = useCallback(
    async (
      orderId: string,
      patch: {
        orderStatus?: OrderStatus;
        paymentStatus?: PaymentStatus;
        trackingNumber?: string;
        shippingCarrier?: string;
      }
    ) => {
      if (!isAdmin) return;
      const updatedAt = new Date().toISOString();
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...patch, updatedAt } : o))
      );
      try {
        await updateDoc(doc(db, 'orders', orderId), { ...patch, updatedAt });
        await logAdminAction(
          'UPDATE_ORDER',
          'orders',
          `Bestellung ${orderId} aktualisiert (${patch.orderStatus || patch.paymentStatus || 'Tracking'})`,
          orderId
        );
        pushToast('Bestellstatus aktualisiert.', 'success');
      } catch (err) {
        console.warn('Order update Firestore warning:', err);
        pushToast('Bestellung lokal aktualisiert.', 'info');
      }
    },
    [isAdmin, logAdminAction, pushToast]
  );

  const adminUpdateEnquiryStatus = useCallback(
    async (id: string, status: 'new' | 'replied' | 'closed') => {
      if (!isAdmin) return;
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
      try {
        await updateDoc(doc(db, 'enquiries', id), { status });
      } catch {
        // ignore if enquiry was guest local only
      }
    },
    [isAdmin]
  );

  const value: StoreContextValue = {
    currentPath,
    navigate,
    language,
    setLanguage,
    t,
    authReady,
    firebaseUser,
    userProfile,
    isAdmin,
    signInWithGoogle,
    logout,
    updateUserProfile,
    settings,
    categories,
    brands,
    products,
    coupons,
    reviews,
    blogPosts,
    faqs,
    testimonials,
    firestoreSeeded,
    seedFirestoreWithDemoData,
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTotal,
    cartCount,
    wishlistIds,
    toggleWishlist,
    compareIds,
    toggleCompare,
    clearCompare,
    recentProductIds,
    recordProductView,
    quickViewProduct,
    setQuickViewProduct,
    orders,
    createOrderRecord,
    requestOrderReturn,
    submitReview,
    enquiries,
    submitEnquiry,
    auditLogs,
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
    adminSaveTestimonial,
    adminDeleteTestimonial,
    adminSaveCoupon,
    adminDeleteCoupon,
    adminUpdateOrder,
    adminUpdateEnquiryStatus,
    publicConfig,
    cookieConsent,
    updateCookieConsent,
    openCookieSettings,
    setOpenCookieSettings,
    toasts,
    pushToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
