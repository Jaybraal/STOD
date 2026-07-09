import type { DocumentType } from '../db/schemas';

export const DOCUMENT_TYPE_META: Record<DocumentType, { label: string; short: string }> = {
  receta:            { label: 'Receta médica',              short: 'Receta' },
  certificado:       { label: 'Certificado médico',          short: 'Certificado' },
  referimiento:      { label: 'Referimiento médico',         short: 'Referimiento' },
  orden_laboratorio: { label: 'Orden de laboratorio',        short: 'Orden lab.' },
  orden_imagenes:    { label: 'Orden de imágenes diagnósticas', short: 'Orden imágenes' },
};

export const DOCUMENT_TYPE_LIST: DocumentType[] = [
  'receta',
  'certificado',
  'referimiento',
  'orden_laboratorio',
  'orden_imagenes',
];

export function resolveDocType(type: string): DocumentType | null {
  return (DOCUMENT_TYPE_LIST as string[]).includes(type) ? (type as DocumentType) : null;
}
