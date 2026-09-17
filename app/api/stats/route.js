const { sql } = require('../../../lib/db');

export async function GET() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const totalStudents = await sql`SELECT COUNT(*) as count FROM students`;
    const todayAttendance = await sql`SELECT COUNT(*) as count FROM attendance WHERE date = ${today}`;
    const totalRecords = await sql`SELECT COUNT(*) as count FROM attendance`;
    
    const recent = await sql`
      SELECT a.*, s.grade FROM attendance a 
      LEFT JOIN students s ON a.student_id = s.id 
      WHERE a.date = ${today}
      ORDER BY a.created_at DESC 
      LIMIT 10
    `;

    return Response.json({
      totalStudents: totalStudents[0].count,
      todayAttendance: todayAttendance[0].count,
      totalRecords: totalRecords[0].count,
      recent
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
