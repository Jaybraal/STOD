import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isValidPlanId, resolvePlanPriceId } from '../services/stripe';

describe('isValidPlanId', () => {
  it('acepta los 3 planes válidos', () => {
    expect(isValidPlanId('basico')).toBe(true);
    expect(isValidPlanId('clinica')).toBe(true);
    expect(isValidPlanId('clinica_plus')).toBe(true);
  });

  it('rechaza planIds desconocidos o vacíos', () => {
    expect(isValidPlanId('premium')).toBe(false);
    expect(isValidPlanId('')).toBe(false);
    expect(isValidPlanId(undefined)).toBe(false);
    expect(isValidPlanId(null)).toBe(false);
    expect(isValidPlanId(123)).toBe(false);
  });
});

describe('resolvePlanPriceId', () => {
  const ENV_VARS = ['STRIPE_PRICE_BASICO', 'STRIPE_PRICE_CLINICA', 'STRIPE_PRICE_CLINICA_PLUS'];
  const originalValues: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_VARS) {
      originalValues[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_VARS) {
      if (originalValues[key] === undefined) delete process.env[key];
      else process.env[key] = originalValues[key];
    }
  });

  it('lanza error si el planId no es uno de los 3 válidos', () => {
    expect(() => resolvePlanPriceId('inventado')).toThrow(/planId inválido/);
  });

  it('lanza error si falta la variable de entorno del price correspondiente', () => {
    expect(() => resolvePlanPriceId('basico')).toThrow(/STRIPE_PRICE_BASICO/);
  });

  it('devuelve el price id correcto para cada plan cuando la env var está seteada', () => {
    process.env.STRIPE_PRICE_BASICO = 'price_basico_123';
    process.env.STRIPE_PRICE_CLINICA = 'price_clinica_456';
    process.env.STRIPE_PRICE_CLINICA_PLUS = 'price_clinica_plus_789';

    expect(resolvePlanPriceId('basico')).toBe('price_basico_123');
    expect(resolvePlanPriceId('clinica')).toBe('price_clinica_456');
    expect(resolvePlanPriceId('clinica_plus')).toBe('price_clinica_plus_789');
  });
});
