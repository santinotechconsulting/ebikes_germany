import { jsPDF } from 'jspdf';
import type { Order, SiteSettings } from '../types/store';
import { formatDateDe, formatEur } from './format';

export function downloadOrderInvoicePdf(order: Order, settings: SiteSettings): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(23, 28, 34);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(settings.brandName, 16, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${settings.streetAddress} · ${settings.postalCode} ${settings.city} · Deutschland`, 16, 23);
  doc.text(`${settings.contactEmail} · ${settings.contactPhone}`, 16, 28);

  // Invoice meta
  doc.setTextColor(23, 28, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('RECHNUNG / ORDER INVOICE', 16, 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Rechnungsnummer: RE-${order.orderNumber}`, 16, 56);
  doc.text(`Bestellnummer: ${order.orderNumber}`, 16, 62);
  doc.text(`Bestelldatum: ${formatDateDe(order.createdAt)}`, 16, 68);
  doc.text(`Zahlungsstatus: ${order.paymentStatus.toUpperCase()} (${order.paymentProvider})`, 16, 74);

  // Billing / Shipping address
  doc.setFont('helvetica', 'bold');
  doc.text('Rechnungs- & Lieferanschrift:', 120, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(`${order.billingAddress.firstName} ${order.billingAddress.lastName}`, 120, 62);
  doc.text(order.billingAddress.street, 120, 68);
  doc.text(`${order.billingAddress.postalCode} ${order.billingAddress.city}`, 120, 74);
  doc.text(order.billingAddress.country, 120, 80);

  // Line items table header
  let y = 96;
  doc.setFillColor(244, 246, 248);
  doc.rect(16, y - 6, pageWidth - 32, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Artikel / Konfiguration', 18, y);
  doc.text('Menge', 124, y);
  doc.text('Einzelpreis', 145, y);
  doc.text('Gesamt', 174, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  order.items.forEach((item) => {
    doc.text(`${item.brand} ${item.name}`, 18, y);
    doc.setFontSize(8);
    doc.setTextColor(100, 110, 120);
    doc.text(`SKU: ${item.sku} · Farbe: ${item.color} · Rahmen: ${item.frameSize}`, 18, y + 4.5);
    doc.setTextColor(23, 28, 34);
    doc.setFontSize(9);
    doc.text(String(item.quantity), 126, y);
    doc.text(formatEur(item.unitPriceEur), 145, y);
    doc.text(formatEur(item.unitPriceEur * item.quantity), 174, y);
    y += 12;
  });

  // Totals with German 19% VAT breakdown
  y += 4;
  doc.setDrawColor(220, 224, 230);
  doc.line(16, y, pageWidth - 16, y);
  y += 8;

  const netAmount = order.totalEur / 1.19;
  const vatAmount = order.totalEur - netAmount;

  doc.text('Zwischensumme (inkl. MwSt.):', 115, y);
  doc.text(formatEur(order.subtotalEur), 174, y);
  y += 6;

  if (order.discountEur > 0) {
    doc.text(`Rabatt (${order.discountCode || 'Gutschein'}):`, 115, y);
    doc.text(`-${formatEur(order.discountEur)}`, 174, y);
    y += 6;
  }

  doc.text('Speditionsversand:', 115, y);
  doc.text(order.shippingEur === 0 ? 'Kostenlos' : formatEur(order.shippingEur), 174, y);
  y += 6;

  doc.setTextColor(90, 100, 110);
  doc.text('Enthaltener Nettobetrag:', 115, y);
  doc.text(formatEur(netAmount), 174, y);
  y += 6;
  doc.text('Enthaltene gesetzl. MwSt. (19 %):', 115, y);
  doc.text(formatEur(vatAmount), 174, y);
  y += 8;

  doc.setTextColor(23, 28, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Gesamtbetrag (Brutto):', 115, y);
  doc.text(formatEur(order.totalEur), 174, y);

  // Footer disclaimer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(110, 118, 128);
  doc.text(
    'Hinweis: Dies ist ein automatisch erzeugter Demo-Beleg / Sandbox-Rechnungsentwurf ohne steuerrechtliche Gültigkeit.',
    16,
    280
  );

  doc.save(`Rechnung-${order.orderNumber}.pdf`);
}
