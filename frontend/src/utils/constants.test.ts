import { describe, it, expect } from 'vitest';
import { clinicTypeLabel } from './constants';

describe('clinicTypeLabel', () => {
  it('devuelve una etiqueta específica para dental', () => {
    expect(clinicTypeLabel('dental')).toBe('Sistema de Gestión — Odontología / Dental');
  });

  it('devuelve una etiqueta específica para veterinaria', () => {
    expect(clinicTypeLabel('veterinaria')).toBe('Sistema de Gestión — Veterinaria');
  });

  it('no contiene "Odontología" cuando la especialidad no es dental', () => {
    expect(clinicTypeLabel('psicologia')).not.toMatch(/Odontología/);
  });

  it('devuelve una etiqueta genérica cuando no hay clinicType', () => {
    expect(clinicTypeLabel(undefined)).toBe('Sistema de Gestión Clínica');
  });

  it('devuelve una etiqueta genérica para un clinicType desconocido', () => {
    expect(clinicTypeLabel('algo-inventado' as never)).toBe('Sistema de Gestión Clínica');
  });
});
