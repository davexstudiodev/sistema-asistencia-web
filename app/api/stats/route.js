const { sql } = require('../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const totalStudents = await sql`SELECT COUNT(*) as count FROM students`;
    const todayAttendance = await sql`SELECT COUNT(*) as count FROM attendance WHERE date = ${today}`;
    const totalRecords = await sql`SELECT COUNT(*) as count FROM attendance`;

    // Asistencia por grado/seccion hoy
    let bySection = [];
    try {
      bySection = await sql`
        SELECT s.grade, s.section, s.teacher,
               COUNT(DISTINCT a.student_id) as asistieron,
               (SELECT COUNT(*) FROM students WHERE grade = s.grade AND section = s.section) as total
        FROM students s
        LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ${today}
        GROUP BY s.grade, s.section, s.teacher
        ORDER BY s.grade, s.section
      `;
    } catch(e) {}

    // Ultimos registros
    let recent = [];
    try {
      recent = await sql`
        SELECT a.*, s.grade, s.section, s.teacher FROM attendance a
        LEFT JOIN students s ON a.student_id = s.id
        WHERE a.date = ${today}
        ORDER BY a.created_at DESC
        LIMIT 10
      `;
    } catch (e) {}

    // Lista de maestros unicos
    let teachers = [];
    try {
      teachers = await sql`
        SELECT DISTINCT teacher FROM students WHERE teacher != '' ORDER BY teacher
      `;
    } catch(e) {}

    return Response.json({
      totalStudents: parseInt(totalStudents[0].count) || 0,
      todayAttendance: parseInt(todayAttendance[0].count) || 0,
      totalRecords: parseInt(totalRecords[0].count) || 0,
      bySection: Array.isArray(bySection) ? bySection : [],
      recent: Array.isArray(recent) ? recent : [],
      teachers: Array.isArray(teachers) ? teachers.map(t => t.teacher) : []
    });
  } catch (error) {
    return Response.json({ totalStudents: 0, todayAttendance: 0, totalRecords: 0, bySection: [], recent: [], teachers: [] });
  }
}
