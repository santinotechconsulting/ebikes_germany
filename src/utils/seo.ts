export interface SeoMetadataInput {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: 'website' | 'product' | 'article';
  ogImage?: string;
  siteName?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function applySeoMetadata(input: SeoMetadataInput): void {
  document.title = input.title;
  const origin = window.location.origin;
  const canonicalUrl = input.canonicalPath.startsWith('http')
    ? input.canonicalPath
    : `${origin}${input.canonicalPath}`;

  setMetaTag('name', 'description', input.description);
  setMetaTag('name', 'robots', input.noindex ? 'noindex, nofollow' : 'index, follow');

  setMetaTag('property', 'og:type', input.ogType || 'website');
  setMetaTag('property', 'og:title', input.title);
  setMetaTag('property', 'og:description', input.description);
  setMetaTag('property', 'og:url', canonicalUrl);
  if (input.siteName) {
    setMetaTag('property', 'og:site_name', input.siteName);
  }
  if (input.ogImage) {
    const absImg = input.ogImage.startsWith('http') ? input.ogImage : `${origin}${input.ogImage}`;
    setMetaTag('property', 'og:image', absImg);
    setMetaTag('name', 'twitter:image', absImg);
  }

  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', input.title);
  setMetaTag('name', 'twitter:description', input.description);

  let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!linkCanonical) {
    linkCanonical = document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    document.head.appendChild(linkCanonical);
  }
  linkCanonical.setAttribute('href', canonicalUrl);

  const existingScripts = document.querySelectorAll('script[data-dynamic-jsonld="true"]');
  existingScripts.forEach((s) => s.remove());

  if (input.jsonLd) {
    const schemas = Array.isArray(input.jsonLd) ? input.jsonLd : [input.jsonLd];
    schemas.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-dynamic-jsonld', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });
  }
}
