const { sql, initDB } = require('../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDB();
    return Response.json({ ok: true, message: 'Base de datos inicializada' });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
