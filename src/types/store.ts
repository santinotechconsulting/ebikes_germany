export type Language = 'de' | 'en';

export type FrameType = 'Diamant' | 'Trapez' | 'Tiefeinsteiger' | 'Fully' | 'Kompakt' | 'Cargo';

export type PaymentMethod = 'card' | 'paypal' | 'klarna' | 'sepa' | 'bank_transfer';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'verified' | 'failed' | 'refunded';

export interface SiteSettings {
  brandName: string;
  tagline: string;
  announcementText: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroBannerImage: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  businessHours: string;
  freeShippingThresholdEur: number;
  standardShippingEur: number;
  ga4MeasurementId: string;
  gtmContainerId: string;
  metaPixelId: string;
  paymentMethods: PaymentMethod[];
  aboutTitle: string;
  aboutStory: string;
  footerNote: string;
  legalImpressum: string;
  legalDatenschutz: string;
  legalAgb: string;
  legalWiderruf: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  sortOrder: number;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  country: string;
  description: string;
}

export interface Product {
  id: string;
  sku: string;
  gtin?: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  priceEur: number;
  previousPriceEur?: number;
  shortDescription: string;
  description: string;
  images: string[];
  colors: string[];
  frameSizes: string[];
  frameType: FrameType;
  motorBrand: string;
  motorModel: string;
  motorPowerW: number;
  motorTorqueNm: number;
  maxAssistedSpeedKmh: 25 | 45;
  isSPedelec: boolean;
  batteryWh: number;
  chargingTimeHours: number;
  rangeKmMin: number;
  rangeKmMax: number;
  rangeNote: string;
  frameMaterial: string;
  brakeSystem: string;
  gearSystem: string;
  weightKg: number;
  warrantyYears: number;
  stock: number;
  featured: boolean;
  isNewArrival: boolean;
  isSpecialOffer: boolean;
  published: boolean;
  ceConformity: string;
  manufacturerInfo: string;
  safetyNotes: string;
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  ogImage: string;
  imageAlt: string;
  ratingAvg: number;
  reviewCount: number;
  isDemoData: boolean;
  updatedAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed' | 'free_shipping';
  value: number;
  minPurchaseEur: number;
  startDate: string;
  expiryDate: string;
  active: boolean;
  description: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  isDemoData: boolean;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  authorName: string;
  authorRole: string;
  featuredImage: string;
  imageAlt: string;
  publishedAt: string;
  readingMinutes: number;
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  published: boolean;
  isDemoData: boolean;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

export interface Testimonial {
  id: string;
  authorName: string;
  role: string;
  city: string;
  quote: string;
  bikeModel: string;
  rating: number;
  isDemoData: boolean;
}

export interface Address {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  isDefault?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  addresses: Address[];
  wishlist: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  sku: string;
  image: string;
  priceEur: number;
  color: string;
  frameSize: string;
  quantity: number;
  maxStock: number;
  isSPedelec: boolean;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  color: string;
  frameSize: string;
  unitPriceEur: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  deliveryInstructions?: string;
  items: OrderItem[];
  subtotalEur: number;
  discountCode?: string;
  discountEur: number;
  shippingEur: number;
  totalEur: number;
  paymentMethod: PaymentMethod;
  paymentProvider: string;
  paymentIntentId: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  trackingNumber?: string;
  shippingCarrier?: string;
  returnRequested?: boolean;
  returnReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Enquiry {
  id: string;
  type: 'contact' | 'stock_alert' | 'newsletter';
  userId?: string;
  name?: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
  productId?: string;
  productName?: string;
  status: 'new' | 'replied' | 'closed';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  targetCollection: string;
  targetId?: string;
  summary: string;
  createdAt: string;
}

export interface CookieConsentState {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
}
