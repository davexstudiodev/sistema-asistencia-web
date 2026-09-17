const { sql, initDB } = require('../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDB();
    
    await sql`
      CREATE TABLE IF NOT EXISTS pending_cards (
        id SERIAL PRIMARY KEY,
        uid VARCHAR(20) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    return Response.json({ ok: true, message: 'Base de datos inicializada' });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
