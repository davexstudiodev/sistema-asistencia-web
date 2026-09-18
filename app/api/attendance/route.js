const { sql } = require('../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await sql`
      SELECT a.*, s.level
      FROM attendance a
      LEFT JOIN students s ON a.student_id = s.id
      ORDER BY a.created_at DESC
      LIMIT 500
    `;
    return Response.json(result);
  } catch (error) {
    return Response.json([]);
  }
}

export async function POST(request) {
  try {
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
      INSERT INTO attendance (student_id, uid, name, grade, section, date, time)
      VALUES (${student.id}, ${uid}, ${student.name}, ${student.grade || ''}, ${student.section || 'A'}, ${date}, ${time})
      RETURNING *
    `;

    return Response.json({ ok: true, attendance: result[0], student });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
