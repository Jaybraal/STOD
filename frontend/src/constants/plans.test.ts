import { describe, it, expect } from 'vitest';
import { PLANS } from './plans';

describe('PLANS', () => {
  it('tiene exactamente 3 planes con los ids esperados', () => {
    expect(PLANS.map((p) => p.id)).toEqual(['basico', 'clinica', 'clinica_plus']);
  });

  it('cada plan tiene precio, audiencia y al menos una feature', () => {
    for (const plan of PLANS) {
      expect(plan.priceLabel).toMatch(/^\$\d+\/mes$/);
      expect(plan.audience.length).toBeGreaterThan(0);
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });

  it('los precios coinciden con el spec ($25/$55/$95)', () => {
    expect(PLANS.find((p) => p.id === 'basico')?.priceLabel).toBe('$25/mes');
    expect(PLANS.find((p) => p.id === 'clinica')?.priceLabel).toBe('$55/mes');
    expect(PLANS.find((p) => p.id === 'clinica_plus')?.priceLabel).toBe('$95/mes');
  });
});
