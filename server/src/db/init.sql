-- Database initialization script
-- UTF8MB4 support for Hebrew and emoji

CREATE DATABASE IF NOT EXISTS event_invite
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE event_invite;

-- Users table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(500),
  event_date DATE,
  price DECIMAL(10, 2),
  default_text TEXT COMMENT 'תקנון/הערות קבועות',
  theme_color VARCHAR(7) DEFAULT '#7C3AED' COMMENT 'צבע ערכת נושא',
  fields_schema JSON COMMENT 'שדות מותאמים אישית לטופס הלקוח',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invites table
CREATE TABLE IF NOT EXISTS invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE COMMENT 'קישור ייחודי ארוך',
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  event_type VARCHAR(255) COMMENT 'סוג הארוע',
  event_location VARCHAR(500) COMMENT 'מיקום/כתובת הארוע',
  notes TEXT,
  price DECIMAL(10, 2) COMMENT 'מחיר ספציפי להסכם זה',
  event_date DATE COMMENT 'תאריך האירוע הספציפי להסכם זה',
  status ENUM('CREATED', 'SENT', 'VIEWED', 'SIGNED', 'RETURNED') DEFAULT 'CREATED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event_id (event_id),
  INDEX idx_token (token),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invite submissions table
CREATE TABLE IF NOT EXISTS invite_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invite_id INT NOT NULL UNIQUE COMMENT 'הגשה אחת להזמנה',
  payload JSON NOT NULL COMMENT 'כל הנתונים שהלקוח מילא',
  signature_png LONGTEXT COMMENT 'חתימה כ-Base64',
  signed_pdf_path VARCHAR(500) COMMENT 'נתיב לקובץ PDF חתום',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invite_id) REFERENCES invites(id) ON DELETE CASCADE,
  INDEX idx_invite_id (invite_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
