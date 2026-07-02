import PouchDB from 'pouchdb';

export async function ensureIndexes(db: PouchDB.Database<any>): Promise<void> {
  try {
    // Pacientes: búsqueda por clínica + nombre
    await db.createIndex({
      index: { fields: ['type', 'clinic', 'name'] }
    });

    // Citas: por clínica + fecha
    await db.createIndex({
      index: { fields: ['type', 'clinic', 'date'] }
    });

    // Historial: por paciente + fecha
    await db.createIndex({
      index: { fields: ['type', 'patientId', 'date'] }
    });

    // Tratamientos: por estado + clínica
    await db.createIndex({
      index: { fields: ['type', 'status', 'clinic'] }
    });

    // Auditoría: por usuario + fecha
    await db.createIndex({
      index: { fields: ['type', 'userId', 'timestamp'] }
    });

    console.log('✓ Indexes created successfully');
  } catch (err) {
    console.error('Error creating indexes:', err);
    throw err;
  }
}
