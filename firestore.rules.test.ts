/**
 * Security TDD verification spec for E-MOTION BIKES Firestore rules.
 * Evaluates the "Dirty Dozen" attack payloads against DRAFT_firestore.rules / firestore.rules.
 */

export interface DirtyDozenCase {
  id: string;
  description: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const dirtyDozenCases: DirtyDozenCase[] = [
  {
    id: 'shadow-admin-escalation',
    description: 'User attempts to inject isAdmin field into own profile',
    operation: 'create',
    path: '/users/user1',
    auth: { uid: 'user1', email: 'kunde@example.de', email_verified: true },
    payload: { uid: 'user1', email: 'kunde@example.de', isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'cross-user-pii-read',
    description: 'User attempts to read another customer profile',
    operation: 'get',
    path: '/users/victim_uid',
    auth: { uid: 'user1', email: 'kunde@example.de', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'blanket-users-list',
    description: 'Non-admin attempts to list /users collection',
    operation: 'list',
    path: '/users',
    auth: { uid: 'user1', email: 'kunde@example.de', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'order-prepaid-bypass',
    description: 'Client attempts to create order already marked paid/verified',
    operation: 'create',
    path: '/orders/ord_1',
    auth: { uid: 'user1', email: 'kunde@example.de', email_verified: true },
    payload: {
      orderNumber: 'EMB-2026-001',
      userId: 'user1',
      customerEmail: 'kunde@example.de',
      customerName: 'Max Mustermann',
      items: [{ productId: 'p1', qty: 1 }],
      totalEur: 3499,
      paymentMethod: 'card',
      paymentStatus: 'verified',
      orderStatus: 'paid',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'order-user-spoof',
    description: 'Client attempts to create order under victim userId',
    operation: 'create',
    path: '/orders/ord_2',
    auth: { uid: 'user1', email: 'kunde@example.de', email_verified: true },
    payload: {
      orderNumber: 'EMB-2026-002',
      userId: 'victim_uid',
      customerEmail: 'victim@example.de',
      customerName: 'Victim',
      items: [{ productId: 'p1', qty: 1 }],
      totalEur: 3499,
      paymentMethod: 'card',
      paymentStatus: 'pending',
      orderStatus: 'pending',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'non-admin-product-price-tamper',
    description: 'Regular customer attempts to discount product price to 1 EUR',
    operation: 'update',
    path: '/products/prod_1',
    auth: { uid: 'user1', email: 'kunde@example.de', email_verified: true },
    payload: { priceEur: 1 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'unverified-admin-email-spoof',
    description: 'Attacker claims admin email without email_verified == true',
    operation: 'update',
    path: '/settings/site',
    auth: { uid: 'attacker', email: 'betrandnk502@gmail.com', email_verified: false },
    payload: { brandName: 'HACKED' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'oversized-id-poisoning',
    description: 'Request uses >128 char document ID',
    operation: 'get',
    path: `/products/${'a'.repeat(200)}`,
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'review-author-spoof',
    description: 'User submits review claiming another userId',
    operation: 'create',
    path: '/reviews/rev_1',
    auth: { uid: 'user1', email: 'kunde@example.de', email_verified: true },
    payload: {
      productId: 'prod_1',
      userId: 'other_user',
      authorName: 'Fake',
      rating: 5,
      title: 'Great',
      comment: 'Spoofed author review',
      isDemoData: false,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'unauthenticated-enquiry-list',
    description: 'Guest attempts to list customer enquiries PII',
    operation: 'list',
    path: '/enquiries',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'audit-log-delete',
    description: 'Anyone attempts to tamper with or delete audit logs',
    operation: 'delete',
    path: '/auditLogs/log_1',
    auth: { uid: 'admin', email: 'betrandnk502@gmail.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'terminal-order-return-mutation',
    description: 'Customer attempts to change orderStatus or totalEur on existing order',
    operation: 'update',
    path: '/orders/ord_1',
    auth: { uid: 'user1', email: 'kunde@example.de', email_verified: true },
    payload: { totalEur: 1, orderStatus: 'delivered' },
    expected: 'PERMISSION_DENIED',
  },
];
