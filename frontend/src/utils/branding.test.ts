import { describe, it, expect } from 'vitest';
import { validateBrandingImage, BRANDING_MAX_BYTES } from './branding';

describe('validateBrandingImage', () => {
  it('acepta PNG dentro del límite', () => {
    expect(validateBrandingImage({ type: 'image/png', size: 1000 })).toBeNull();
  });
  it('acepta JPEG', () => {
    expect(validateBrandingImage({ type: 'image/jpeg', size: 1000 })).toBeNull();
  });
  it('rechaza tipo no imagen', () => {
    expect(validateBrandingImage({ type: 'application/pdf', size: 1000 })).toMatch(/PNG|JPG/i);
  });
  it('rechaza archivo demasiado grande', () => {
    expect(validateBrandingImage({ type: 'image/png', size: BRANDING_MAX_BYTES + 1 })).toMatch(/2 ?MB/i);
  });
});
