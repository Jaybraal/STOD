const COUCHDB_URL = process.env.COUCHDB_URL;
const ADMIN_USER = process.env.COUCHDB_ADMIN_USER;
const ADMIN_PASS = process.env.COUCHDB_ADMIN_PASS;
const REGISTRY_DB = 'stod_registry';

const authHeader = () =>
  'Basic ' + Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');

async function couchFetch(path, options = {}) {
  return fetch(`${COUCHDB_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
      ...options.headers,
    },
  });
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  c += '-';
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let pwd = '';
  for (let i = 0; i < 20; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

function dbNameFromCode(code) {
  return 'stod_' + code.toLowerCase().replace('-', '_');
}

async function databaseExists(dbName) {
  const res = await couchFetch(`/${dbName}`, { method: 'HEAD' });
  return res.ok;
}

async function ensureRegistryDB() {
  if (!(await databaseExists(REGISTRY_DB))) {
    await couchFetch(`/${REGISTRY_DB}`, { method: 'PUT' });
  }
}

async function saveCodeRecord(record) {
  await ensureRegistryDB();
  const res = await couchFetch(`/${REGISTRY_DB}/${record.code}`, {
    method: 'PUT',
    body: JSON.stringify(record),
  });
  if (res.status === 409) {
    const existing = await (await couchFetch(`/${REGISTRY_DB}/${record.code}`)).json();
    await couchFetch(`/${REGISTRY_DB}/${record.code}`, {
      method: 'PUT',
      body: JSON.stringify({ ...record, _rev: existing._rev }),
    });
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let code = generateCode();
    let dbName = dbNameFromCode(code);
    let attempts = 0;
    while ((await databaseExists(dbName)) && attempts < 10) {
      code = generateCode();
      dbName = dbNameFromCode(code);
      attempts++;
    }

    const username = `stod_user_${code.toLowerCase().replace('-', '')}`;
    const password = generatePassword();
    const syncUrl = `${COUCHDB_URL}/${dbName}`;

    await couchFetch(`/${dbName}`, { method: 'PUT' });
    await couchFetch(`/_users/org.couchdb.user:${username}`, {
      method: 'PUT',
      body: JSON.stringify({ name: username, password, roles: [], type: 'user' }),
    });
    await couchFetch(`/${dbName}/_security`, {
      method: 'PUT',
      body: JSON.stringify({
        admins: { names: [], roles: [] },
        members: { names: [username], roles: [] },
      }),
    });
    await saveCodeRecord({
      code,
      dbName,
      syncUrl,
      username,
      password,
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({ code, syncUrl, username, password });
  } catch (err) {
    console.error('[sync/generate]', err);
    res.status(500).json({ error: 'Error generando código de sincronización' });
  }
};
