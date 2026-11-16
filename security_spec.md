# Security Specification & Payload-First Security TDD — E-MOTION BIKES

## 1. Data Invariants
1. **Default Deny**: Every unmatched path is denied (`match /{document=**} { allow read, write: if false; }`).
2. **PII Isolation**: `/users/{userId}`, `/orders/{orderId}`, `/enquiries/{enquiryId}`, and `/auditLogs/{logId}` contain PII or sensitive operational data and are never readable by non-owners or unauthenticated users.
3. **Admin Role Integrity**: Only `betrandnk502@gmail.com` (with `email_verified == true`) or documents existing in `/admins/{uid}` possess admin privileges. Regular users can never self-assign admin roles or escalate privileges.
4. **Order Payment Integrity**: Clients creating an order in `/orders/{orderId}` MUST set `userId == request.auth.uid`, `paymentStatus == 'pending'`, and `orderStatus == 'pending'`. Only admins or verified server flows can transition an order to `'paid'` / `'shipped'` / `'delivered'`.
5. **Unpublished Product Isolation**: Public users may only read products where `published == true` and blog posts where `published == true`.
6. **Path ID & String Length Hardening**: All document IDs are validated against `^[a-zA-Z0-9_-]+$` (`<= 128` chars), and every string and array field has explicit `.size()` boundaries.
7. **Update Action Isolation**: All client updates use `affectedKeys().hasOnly(...)` combined with full `isValid*()` payload validation.

## 2. The "Dirty Dozen" Attack Payloads
1. **Shadow Admin Escalation on `/users/{uid}`**: `{ "uid": "user1", "email": "u@e.de", "isAdmin": true }` -> `PERMISSION_DENIED` (blocked by `keys().hasOnly(...)`).
2. **Reading Another User's Profile**: `get /users/other_uid` as `user1` -> `PERMISSION_DENIED`.
3. **Blanket List of `/users`**: `list /users` as `user1` -> `PERMISSION_DENIED`.
4. **Creating Order Marked Pre-Paid**: `create /orders/ord_1` with `{ "userId": "user1", "paymentStatus": "verified", "orderStatus": "paid", ... }` -> `PERMISSION_DENIED`.
5. **Creating Order for Another User**: `create /orders/ord_2` with `{ "userId": "victim_uid", ... }` as `user1` -> `PERMISSION_DENIED`.
6. **Listing All Orders Without Owner Filter**: `list /orders` without `where('userId', '==', uid)` -> `PERMISSION_DENIED`.
7. **Non-Admin Modifying Product Price**: `update /products/prod_1` with `{ "priceEur": 1 }` as `user1` -> `PERMISSION_DENIED`.
8. **Reading Unpublished Draft Product**: `get /products/draft_1` where `published == false` as guest -> `PERMISSION_DENIED`.
9. **Spoofed Admin Email Without Verification**: `request.auth.token.email == 'betrandnk502@gmail.com'` with `email_verified == false` -> `PERMISSION_DENIED`.
10. **Oversized ID Poisoning**: `get /products/<200-char-junk>` -> `PERMISSION_DENIED`.
11. **Review Author Spoofing**: `create /reviews/rev_1` with `userId: "other_uid"` -> `PERMISSION_DENIED`.
12. **Reading Customer Enquiries as Regular User**: `list /enquiries` as `user1` -> `PERMISSION_DENIED`.
