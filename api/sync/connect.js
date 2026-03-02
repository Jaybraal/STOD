const COUCHDB_URL = process.env.COUCHDB_URL;
const ADMIN_USER = process.env.COUCHDB_ADMIN_USER;
const ADMIN_PASS = process.env.COUCHDB_ADMIN_PASS;
const REGISTRY_DB = 'stod_registry';

const authHeader = () =>
  'Basic ' + Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');

async function couchFetch(path) {
  return fetch(`${COUCHDB_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
  });
}

async function getCodeRecord(code) {
  const res = await couchFetch(`/${REGISTRY_DB}/${code}`);
  if (!res.ok) return null;
  return res.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Código requerido' });
  }

  try {
    const record = await getCodeRecord(code.toUpperCase().trim());
    if (!record) {
      return res.status(404).json({ error: 'Código no encontrado o expirado' });
    }
    res.status(200).json({
      code: record.code,
      syncUrl: record.syncUrl,
      username: record.username,
      password: record.password,
    });
  } catch (err) {
    console.error('[sync/connect]', err);
    res.status(500).json({ error: 'Error al conectar' });
  }
};
