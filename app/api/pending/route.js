const { sql } = require('../../../lib/db');

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS pending_cards (
        id SERIAL PRIMARY KEY,
        uid VARCHAR(20) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    const pending = await sql`SELECT * FROM pending_cards ORDER BY created_at DESC LIMIT 1`;
    if (pending.length > 0) {
      return Response.json({ pending: true, uid: pending[0].uid });
    }
    return Response.json({ pending: false });
  } catch (error) {
    return Response.json({ pending: false });
  }
}

export async function DELETE() {
  try {
    await sql`DELETE FROM pending_cards`;
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false });
  }
}
