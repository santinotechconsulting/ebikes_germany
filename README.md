# E-MOTION BIKES – Premium E-Bike Online Store (Deutschland)

Eine moderne, mobile-first E-Commerce-Plattform für Elektrofahrräder in Deutschland mit vollständiger Storefront, technischem Vergleichsrechner, interaktivem Kaufberater, serverseitiger Zahlungsverifizierung, PDF-Rechnungserstellung, Google Maps Showroom-Karte, deutschem SEO-System und rollenbasiertem Admin-Dashboard.

---

## Funktionsumfang

- **Storefront (Deutsch Standard, EN Umschalter)**:
  - Startseite mit Hero-Banner, 6 Hauptkategorien (City, Trekking, E-MTB, Cargo, Falt-E-Bikes, SUV), Bestseller/Neuheiten/Angebote, Markenpartner, Kundenstimmen, Finanzierungs-/Versandhinweisen, Newsletter & SEO-Ratgeber.
  - **Shop & Katalog (`/shop`, `/kategorie/:slug`)**: 11 Filter (Kategorie, Hersteller, Preis, Akku Wh, Motorhersteller, Motorleistung, Unterstützung 25/45 km/h, Rahmengröße, Rahmentyp, Farbe, Verfügbarkeit) & Sortierung.
  - **Produktdetailseite (`/produkt/:slug`)**: Zoom-Bildergalerie, Rahmengröße/Farbe, Pedelec (25 km/h EN 15194) vs. S-Pedelec (45 km/h L1e-B) Kennzeichnung, GPSR/CE-Felder, Bewertungen, FAQs, Verfügbarkeits-Alert bei Bestand 0, Schema.org `Product` + `BreadcrumbList` JSON-LD.
  - **Modellvergleich (`/vergleich`)**: Bis zu 4 E-Bikes direkt im Vergleich.
  - **Kaufberater (`/kaufberater`)**: Interaktiver 5-Schritte-Finder.
  - **Warenkorb & Kasse (`/warenkorb`, `/checkout`)**: Gutscheincodes (`WILLKOMMEN100`, `PENDLER10`, `VERSANDFREI`), 19 % MwSt.-Ausweis, serverseitige Zahlungssession & Verifizierung (`/api/payments/create-session`, `/api/payments/verify`), PDF-Rechnung (`jsPDF`).
  - **Kundenkonto (`/konto`)**: Firebase Google Sign-In, Lieferadressen, Bestellhistorie, Sendungsverfolgung, PDF-Download, Widerrufs-/Rückgabeanfrage, Wunschliste.
  - **Wissenszentrum (`/ratgeber`, `/ratgeber/:slug`)**: Deutsche Ratgeberartikel inkl. `Article` JSON-LD und 15-Themen-Redaktionsplan.
  - **Kontakt & Showroom (`/kontakt`)**: Kontaktformular + interaktive Google Maps Platform Karte (`@vis.gl/react-google-maps`).
  - **Rechtliches (`/impressum`, `/datenschutz`, `/agb`, `/widerruf`, `/versand`)**: Konfigurierbare Mustertexte inkl. Online-Widerrufsformular & TDDDG/DSGVO Cookie-Consent-Steuerung.
  - **Admin Dashboard (`/admin`)**: KPIs, Umsatzchart, Demo-Daten-Seeder für Firestore, CRUD für Produkte, Kategorien, Marken, Gutscheine, Bestellungen (inkl. Erstattung), Anfragen, Shop-Branding/Rechtstexte, SEO-Health-Audit und Audit-Log.

---

## Technologie-Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, `jsPDF`
- **Backend / API**: Node.js + Express (`server.ts`) mit Vite SSR/Middleware-Einbindung
- **Datenbank & Auth**: Firebase Firestore + Firebase Authentication (Google Sign-In)
- **Karten**: Google Maps Platform (`@vis.gl/react-google-maps`)

---

## Umgebungsvariablen (`.env`)

Legen Sie basierend auf `.env.example` Ihre Umgebungsvariablen an:

```env
APP_URL="http://localhost:3000"
VITE_GOOGLE_MAPS_API_KEY=""

# Optionale Live/Test-Zahlungs- & E-Mail-Provider (ohne Schlüssel läuft signierter Sandbox-Modus)
STRIPE_SECRET_KEY=""
MOLLIE_API_KEY=""
RESEND_API_KEY=""
EMAIL_FROM="E-MOTION BIKES <service@emotion-bikes-demo.de>"
PAYMENT_SIGNING_SECRET=""
```

---

## Entwicklung & Build

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver (Port 3000, Express + Vite)
npm run dev

# Typprüfung
npm run lint

# Produktions-Build (Frontend + Server)
npm run build

# Produktions-Server starten
npm start
```

---

## Hinweise zu Rechtstexten, Demo-Daten & Produktivbetrieb

- Alle im Auslieferungszustand sichtbaren Produkte, Markenbeschreibungen, Kundenstimmen, Bewertungen und Impressums-/AGB-Vorlagen sind klar als **Muster- / Demo-Daten** gekennzeichnet.
- Vor einem produktiven Betrieb in Deutschland müssen alle Unternehmensdaten, WEEE-/BattG-Registrierungen, Rechtstexte (durch juristische Prüfung) und Produkt-Spezifikationen im **Admin Dashboard** gepflegt und in Firestore gespeichert werden.
- Technische Endpunkte für Suchmaschinen: `/robots.txt` und `/sitemap.xml` werden dynamisch vom Express-Server ausgeliefert.
