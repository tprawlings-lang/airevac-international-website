import Image from 'next/image';
import { MEDIA, publishableMedia, type MediaAsset } from '@/content/media';

/**
 * Renders a registered image, gated on its publication status.
 *
 * Like `CredentialCard`, the gate is INSIDE the component. A page cannot render
 * a held image by passing a different prop, and a new page that uses `<Photo>`
 * inherits the rule for free. Anything on hold returns `null`, or an optional
 * fallback so a layout does not collapse.
 *
 * Uses `next/image`, which generates AVIF/WebP and a responsive srcset from the
 * local file. That matters for the Core Web Vitals gate on page 21 — the
 * golden-hour hero source is a 24 MB camera original, and shipping anything
 * close to that would blow the LCP budget on a phone in a hospital corridor.
 */
export function Photo({
  id,
  className = '',
  sizes,
  priority = false,
  fallback = null,
}: {
  /** Key in the MEDIA registry. */
  id: keyof typeof MEDIA;
  className?: string;
  /** Responsive sizes hint. Set it — the default assumes full viewport width. */
  sizes?: string;
  /** True only for an above-the-fold LCP image. */
  priority?: boolean;
  /** Rendered when the asset is gated, so the layout does not collapse. */
  fallback?: React.ReactNode;
}) {
  const asset: MediaAsset | undefined = MEDIA[id];

  if (asset === undefined || !publishableMedia(asset)) return <>{fallback}</>;

  return (
    <Image
      src={asset.src}
      alt={asset.alt}
      width={asset.width}
      height={asset.height}
      sizes={sizes ?? '100vw'}
      priority={priority}
      className={className}
    />
  );
}

/**
 * Decorative variant: fills its positioned parent and is hidden from assistive
 * technology.
 *
 * For backdrops behind text, where the surrounding copy already carries the
 * meaning. An empty `alt` is correct here — describing a background photograph
 * that repeats the headline just adds noise for a screen-reader user (WCAG
 * 1.1.1 decorative images).
 */
export function BackdropPhoto({
  id,
  className = '',
  sizes,
  priority = false,
}: {
  id: keyof typeof MEDIA;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const asset: MediaAsset | undefined = MEDIA[id];

  if (asset === undefined || !publishableMedia(asset)) return null;

  return (
    <Image
      src={asset.src}
      alt=""
      aria-hidden="true"
      fill
      sizes={sizes ?? '100vw'}
      priority={priority}
      className={className}
    />
  );
}
