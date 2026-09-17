const { sql } = require('../../../lib/db');

export async function GET() {
  try {
    const students = await sql`SELECT * FROM students ORDER BY name`;
    return Response.json(students);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { uid, name, grade, level } = await request.json();
    
    const existing = await sql`SELECT id FROM students WHERE uid = ${uid}`;
    if (existing.length > 0) {
      return Response.json({ ok: false, message: 'UID ya registrado' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO students (uid, name, grade, level)
      VALUES (${uid}, ${name}, ${grade}, ${level || 1})
      RETURNING *
    `;
    
    return Response.json({ ok: true, student: result[0] });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    await sql`DELETE FROM students WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
