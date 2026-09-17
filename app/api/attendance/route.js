const { sql } = require('../../../lib/db');

export async function GET() {
  try {
    const attendance = await sql`
      SELECT a.*, s.grade, s.level 
      FROM attendance a 
      LEFT JOIN students s ON a.student_id = s.id 
      ORDER BY a.created_at DESC 
      LIMIT 200
    `;
    return Response.json(attendance);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { uid } = await request.json();
    
    const students = await sql`SELECT * FROM students WHERE uid = ${uid}`;
    if (students.length === 0) {
      return Response.json({ ok: false, message: 'Tarjeta no registrada', needsRegistration: true, uid }, { status: 404 });
    }

    const student = students[0];
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    const existing = await sql`
      SELECT id FROM attendance 
      WHERE uid = ${uid} AND date = ${date}
    `;
    
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
