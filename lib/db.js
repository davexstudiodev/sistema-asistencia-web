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
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id),
      uid VARCHAR(20) NOT NULL,
      name VARCHAR(100) NOT NULL,
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

  // Migrations using DO block (PostgreSQL compatible)
  await sql`DO $$ BEGIN ALTER TABLE students ADD COLUMN section VARCHAR(10) DEFAULT 'A'; EXCEPTION WHEN duplicate_column THEN END $$`;
  await sql`DO $$ BEGIN ALTER TABLE students ADD COLUMN teacher VARCHAR(100) DEFAULT ''; EXCEPTION WHEN duplicate_column THEN END $$`;
  await sql`DO $$ BEGIN ALTER TABLE attendance ADD COLUMN grade VARCHAR(20) DEFAULT ''; EXCEPTION WHEN duplicate_column THEN END $$`;
  await sql`DO $$ BEGIN ALTER TABLE attendance ADD COLUMN section VARCHAR(10) DEFAULT 'A'; EXCEPTION WHEN duplicate_column THEN END $$`;
  await sql`DO $$ BEGIN ALTER TABLE attendance ADD COLUMN teacher VARCHAR(100) DEFAULT ''; EXCEPTION WHEN duplicate_column THEN END $$`;
}

module.exports = { sql, initDB };
