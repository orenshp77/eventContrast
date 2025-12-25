-- Add event_type and event_location columns to invites table
ALTER TABLE invites
ADD COLUMN event_type VARCHAR(255) AFTER customer_email,
ADD COLUMN event_location VARCHAR(500) AFTER event_type;
