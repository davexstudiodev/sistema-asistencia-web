const { sql } = require('../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const totalStudents = await sql`SELECT COUNT(*) as count FROM students`;
    const todayAttendance = await sql`SELECT COUNT(*) as count FROM attendance WHERE date = ${today}`;
    const totalRecords = await sql`SELECT COUNT(*) as count FROM attendance`;

    let recent = [];
    try {
      recent = await sql`
        SELECT a.*, s.grade FROM attendance a
        LEFT JOIN students s ON a.student_id = s.id
        WHERE a.date = ${today}
        ORDER BY a.created_at DESC
        LIMIT 10
      `;
    } catch (e) {}

    return Response.json({
      totalStudents: parseInt(totalStudents[0].count) || 0,
      todayAttendance: parseInt(todayAttendance[0].count) || 0,
      totalRecords: parseInt(totalRecords[0].count) || 0,
      recent: Array.isArray(recent) ? recent : []
    });
  } catch (error) {
    return Response.json({ totalStudents: 0, todayAttendance: 0, totalRecords: 0, recent: [] });
  }
}
