import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../routes/chat';

describe('buildSystemPrompt', () => {
  it('menciona Odontología cuando clinicType es dental', () => {
    const prompt = buildSystemPrompt('2026-07-13', 'dental');
    expect(prompt).toMatch(/Odontología/);
  });

  it('no menciona Odontología cuando clinicType es veterinaria', () => {
    const prompt = buildSystemPrompt('2026-07-13', 'veterinaria');
    expect(prompt).not.toMatch(/Odontología/);
  });

  it('no menciona Odontología cuando clinicType es psicologia', () => {
    const prompt = buildSystemPrompt('2026-07-13', 'psicologia');
    expect(prompt).not.toMatch(/Odontología/);
  });

  it('usa un rótulo genérico cuando no se envía clinicType', () => {
    const prompt = buildSystemPrompt('2026-07-13');
    expect(prompt).not.toMatch(/Odontología/);
    expect(prompt).toMatch(/Sistema de Gestión Clínica/);
  });

  it('sigue calculando el día de la semana correctamente', () => {
    const prompt = buildSystemPrompt('2026-07-13', 'medicina');
    expect(prompt).toMatch(/lunes, 2026-07-13/);
  });
});
