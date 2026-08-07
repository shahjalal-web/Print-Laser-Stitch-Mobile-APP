/**
 * Requests an appropriately-sized rendition from the CDN that's actually
 * serving the image, instead of shipping the full-resolution original for a
 * thumbnail-sized slot. Shopify CDN and Cloudinary both support on-the-fly
 * resizing via URL params — everything else (own-site assets, YouTube
 * thumbnails, local file URIs from the image picker) is returned unchanged.
 */
export function resizedImageUrl(url: string, pixelWidth: number): string {
  if (url.includes('cdn.shopify.com')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${pixelWidth}`;
  }
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/w_${pixelWidth},c_limit,q_auto,f_auto/`);
  }
  return url;
}
