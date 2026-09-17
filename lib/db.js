const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      uid VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      grade VARCHAR(20) NOT NULL,
      section VARCHAR(10) DEFAULT 'A',
      level INTEGER DEFAULT 1,
      teacher VARCHAR(100) DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id),
      uid VARCHAR(20) NOT NULL,
      name VARCHAR(100) NOT NULL,
      grade VARCHAR(20) NOT NULL,
      section VARCHAR(10) DEFAULT 'A',
      teacher VARCHAR(100) DEFAULT '',
      date VARCHAR(10) NOT NULL,
      time VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS pending_cards (
      id SERIAL PRIMARY KEY,
      uid VARCHAR(20) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Add columns if they don't exist (migration)
  try { await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS section VARCHAR(10) DEFAULT 'A'`; } catch(e) {}
  try { await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS teacher VARCHAR(100) DEFAULT ''`; } catch(e) {}
  try { await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS section VARCHAR(10) DEFAULT 'A'`; } catch(e) {}
  try { await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS teacher VARCHAR(100) DEFAULT ''`; } catch(e) {}
}

module.exports = { sql, initDB };
