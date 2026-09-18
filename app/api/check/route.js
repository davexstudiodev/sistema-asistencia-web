const { sql } = require('../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    if (!uid) return Response.json({ exists: false });

    const result = await sql`SELECT id FROM students WHERE uid = ${uid} LIMIT 1`;
    return Response.json({ exists: result.length > 0 });
  } catch (error) {
    return Response.json({ exists: true });
  }
}
