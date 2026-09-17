const { sql, initDB } = require('../../../lib/db');

async function ensurePendingTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS pending_cards (
      id SERIAL PRIMARY KEY,
      uid VARCHAR(20) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function GET() {
  try {
    await ensurePendingTable();
    const pending = await sql`SELECT * FROM pending_cards ORDER BY created_at DESC LIMIT 1`;
    if (pending.length > 0) {
      return Response.json({ pending: true, uid: pending[0].uid });
    }
    return Response.json({ pending: false });
  } catch (error) {
    return Response.json({ pending: false });
  }
}

export async function POST(request) {
  try {
    await initDB();
    await ensurePendingTable();

    const { uid } = await request.json();

    const students = await sql`SELECT * FROM students WHERE uid = ${uid}`;
    if (students.length === 0) {
      await sql`
        INSERT INTO pending_cards (uid) VALUES (${uid})
        ON CONFLICT (uid) DO UPDATE SET created_at = NOW()
      `;
      return Response.json({ ok: false, message: 'Tarjeta no registrada', needsRegistration: true, uid }, { status: 404 });
    }

    const student = students[0];
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    const existing = await sql`SELECT id FROM attendance WHERE uid = ${uid} AND date = ${date}`;
    if (existing.length > 0) {
      return Response.json({ ok: false, message: 'Ya marco hoy', student });
    }

    const result = await sql`
      INSERT INTO attendance (student_id, uid, name, date, time)
      VALUES (${student.id}, ${uid}, ${student.name}, ${date}, ${time})
      RETURNING *
    `;

    return Response.json({ ok: true, attendance: result[0], student });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
