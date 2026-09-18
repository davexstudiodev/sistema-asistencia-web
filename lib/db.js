const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      uid VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      grade VARCHAR(20) DEFAULT '',
      section VARCHAR(10) DEFAULT 'A',
      level INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      student_id INTEGER,
      uid VARCHAR(20) NOT NULL,
      name VARCHAR(100) NOT NULL,
      grade VARCHAR(20) DEFAULT '',
      section VARCHAR(10) DEFAULT 'A',
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

  // Recreate attendance with all columns (safe - we drop old one)
  await sql`DROP TABLE IF EXISTS attendance`;

  await sql`
    CREATE TABLE attendance (
      id SERIAL PRIMARY KEY,
      student_id INTEGER,
      uid VARCHAR(20) NOT NULL,
      name VARCHAR(100) NOT NULL,
      grade VARCHAR(20) DEFAULT '',
      section VARCHAR(10) DEFAULT 'A',
      date VARCHAR(10) NOT NULL,
      time VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

module.exports = { sql, initDB };
