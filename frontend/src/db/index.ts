// Helper: timestamp ISO actual
export function now(): string {
  return new Date().toISOString();
}

// Helper: generar ID con prefijo
export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
