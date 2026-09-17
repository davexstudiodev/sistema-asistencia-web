const { sql, initDB } = require('../../../lib/db');

export async function POST() {
  try {
    await initDB();
    return Response.json({ ok: true, message: 'Base de datos inicializada' });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
