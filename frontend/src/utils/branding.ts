export const BRANDING_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED = ['image/png', 'image/jpeg'];

export function validateBrandingImage(file: { type: string; size: number }): string | null {
  if (!ALLOWED.includes(file.type)) return 'La imagen debe ser PNG o JPG.';
  if (file.size > BRANDING_MAX_BYTES) return 'La imagen no puede superar 2 MB.';
  return null;
}
