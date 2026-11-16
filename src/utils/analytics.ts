import type { CookieConsentState, SiteSettings } from '../types/store';

const CONSENT_STORAGE_KEY = 'emotion_bikes_cookie_consent_v1';

export function getStoredCookieConsent(): CookieConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsentState;
  } catch {
    return null;
  }
}

export function saveCookieConsent(consent: CookieConsentState): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // Ignore storage quota issues
  }
}

export function activateConsentGatedScripts(
  consent: CookieConsentState | null,
  settings: SiteSettings
): void {
  if (!consent) return;
  const w = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  };

  if (consent.analytics && settings.ga4MeasurementId && !document.getElementById('ga4-script')) {
    const script = document.createElement('script');
    script.id = 'ga4-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      settings.ga4MeasurementId
    )}`;
    document.head.appendChild(script);
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag(...args: unknown[]) {
      w.dataLayer?.push(args);
    };
    w.gtag('js', new Date());
    w.gtag('config', settings.ga4MeasurementId, { anonymize_ip: true });
  }

  if (consent.analytics && settings.gtmContainerId && !document.getElementById('gtm-script')) {
    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(
      settings.gtmContainerId
    )}`;
    document.head.appendChild(script);
  }
}

export type ConversionEventName =
  | 'view_item'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'generate_lead'
  | 'newsletter_signup';

export function trackConversionEvent(
  eventName: ConversionEventName,
  payload: Record<string, unknown>
): void {
  const consent = getStoredCookieConsent();
  if (!consent || (!consent.analytics && !consent.marketing)) {
    return;
  }
  const w = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event: eventName, ...payload });
  if (typeof w.gtag === 'function') {
    w.gtag('event', eventName, payload);
  }
}
