import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Helper to make queries compatible with mysql2 style
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  // Convert MySQL ? placeholders to PostgreSQL $1, $2, etc.
  let paramIndex = 0;
  const pgText = text.replace(/\?/g, () => `$${++paramIndex}`);
  return pool.query(pgText, params);
};

export const execute = query;

export async function initDatabase() {
  const client = await pool.connect();
  try {
    // Test connection
    await client.query('SELECT NOW()');
    console.log('Database connection established');

    // Run migrations if needed
    await runMigrations(client);
  } finally {
    client.release();
  }
}

async function runMigrations(client: any) {
  // Create tables if they don't exist
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      business_name VARCHAR(255),
      business_phone VARCHAR(50),
      business_logo TEXT,
      business_website VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createEventsTable = `
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      location VARCHAR(500),
      event_date DATE,
      price DECIMAL(10, 2),
      default_text TEXT,
      theme_color VARCHAR(7) DEFAULT '#7C3AED',
      fields_schema JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createInvitesTable = `
    CREATE TABLE IF NOT EXISTS invites (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      token VARCHAR(64) NOT NULL UNIQUE,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50),
      customer_email VARCHAR(255),
      event_type VARCHAR(255),
      event_location VARCHAR(500),
      notes TEXT,
      price DECIMAL(10, 2),
      event_date DATE,
      status VARCHAR(20) DEFAULT 'CREATED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createSubmissionsTable = `
    CREATE TABLE IF NOT EXISTS invite_submissions (
      id SERIAL PRIMARY KEY,
      invite_id INTEGER NOT NULL UNIQUE REFERENCES invites(id) ON DELETE CASCADE,
      payload JSONB NOT NULL,
      signature_png TEXT,
      signed_pdf_path VARCHAR(500),
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create indexes
  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_invites_event_id ON invites(event_id);
    CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
    CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);
    CREATE INDEX IF NOT EXISTS idx_submissions_invite_id ON invite_submissions(invite_id);
  `;

  await client.query(createUsersTable);
  await client.query(createEventsTable);
  await client.query(createInvitesTable);
  await client.query(createSubmissionsTable);
  await client.query(createIndexes);

  console.log('Database migrations completed');
}

export default pool;
