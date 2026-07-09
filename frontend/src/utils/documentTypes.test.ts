import { describe, it, expect } from 'vitest';
import { resolveDocType, DOCUMENT_TYPE_META, DOCUMENT_TYPE_LIST } from './documentTypes';

describe('resolveDocType', () => {
  it('acepta tipos válidos', () => {
    expect(resolveDocType('receta')).toBe('receta');
    expect(resolveDocType('orden_imagenes')).toBe('orden_imagenes');
  });
  it('rechaza tipos desconocidos', () => {
    expect(resolveDocType('factura')).toBeNull();
    expect(resolveDocType('')).toBeNull();
  });
});

describe('metadatos', () => {
  it('tiene label para cada tipo de la lista', () => {
    for (const t of DOCUMENT_TYPE_LIST) {
      expect(DOCUMENT_TYPE_META[t].label.length).toBeGreaterThan(0);
    }
  });
  it('lista los 5 tipos', () => {
    expect(DOCUMENT_TYPE_LIST).toHaveLength(5);
  });
});
