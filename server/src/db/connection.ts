import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'eventuser',
  password: process.env.DB_PASSWORD || 'eventpass',
  database: process.env.DB_NAME || 'event_invite',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

export async function initDatabase() {
  const connection = await pool.getConnection();
  try {
    // Test connection
    await connection.ping();
    console.log('Database connection established');

    // Run migrations if needed
    await runMigrations(connection);
  } finally {
    connection.release();
  }
}

async function runMigrations(connection: mysql.PoolConnection) {
  // Create tables if they don't exist
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      business_name VARCHAR(255),
      business_phone VARCHAR(50),
      business_logo TEXT,
      business_website VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  const createEventsTable = `
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      location VARCHAR(500),
      event_date DATE,
      price DECIMAL(10, 2),
      default_text TEXT,
      theme_color VARCHAR(7) DEFAULT '#7C3AED',
      fields_schema JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  const createInvitesTable = `
    CREATE TABLE IF NOT EXISTS invites (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      token VARCHAR(64) NOT NULL UNIQUE,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50),
      customer_email VARCHAR(255),
      notes TEXT,
      price DECIMAL(10, 2),
      event_date DATE,
      status ENUM('CREATED', 'SENT', 'VIEWED', 'SIGNED', 'RETURNED') DEFAULT 'CREATED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      INDEX idx_event_id (event_id),
      INDEX idx_token (token),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  const createSubmissionsTable = `
    CREATE TABLE IF NOT EXISTS invite_submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invite_id INT NOT NULL UNIQUE,
      payload JSON NOT NULL,
      signature_png LONGTEXT,
      signed_pdf_path VARCHAR(500),
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invite_id) REFERENCES invites(id) ON DELETE CASCADE,
      INDEX idx_invite_id (invite_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await connection.execute(createUsersTable);
  await connection.execute(createEventsTable);
  await connection.execute(createInvitesTable);
  await connection.execute(createSubmissionsTable);

  // Add event_date column to invites if it doesn't exist
  try {
    await connection.execute(`
      ALTER TABLE invites ADD COLUMN event_date DATE AFTER price
    `);
    console.log('Added event_date column to invites table');
  } catch (e: any) {
    // Column might already exist, ignore
  }

  // Add business_website column to users if it doesn't exist
  try {
    await connection.execute(`
      ALTER TABLE users ADD COLUMN business_website VARCHAR(255) AFTER business_logo
    `);
    console.log('Added business_website column to users table');
  } catch (e: any) {
    // Column might already exist, ignore
  }

  console.log('Database migrations completed');
}

export default pool;
