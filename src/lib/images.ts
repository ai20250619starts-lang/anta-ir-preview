/**
 * Local images processed by Astro's image pipeline (resized, converted to WebP/AVIF, hashed).
 * Files in src/assets/images are copies of the scraped assets in public/assets/anta (see data/assets.json for sources).
 */
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/images/**/*.{jpg,jpeg,png,webp}', { eager: true });

/** Resolve a data path like "/assets/anta/brand/logo_1.png" (or a bare filename) to processed image metadata. */
export const localImage = (src: string | null | undefined): ImageMetadata | null => {
  if (!src) return null;
  const rel = src.replace(/^\/?assets\/anta\//, '');
  const hit = Object.entries(files).find(([k]) => k.endsWith('/' + rel));
  return hit ? hit[1].default : null;
};
