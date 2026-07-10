-- Attendance OTP codes replace QR attendance tokens.
CREATE TABLE IF NOT EXISTS attendance_codes (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  provider_owner_id TEXT NOT NULL,
  provider_profile_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  session_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP(3) NOT NULL,
  used_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attendance_codes_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT attendance_codes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE attendance ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE attendance ALTER COLUMN nonce_hash DROP NOT NULL;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'OTP_CODE';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS session_date TEXT;
UPDATE attendance SET session_date = bookings.preferred_date FROM bookings WHERE attendance.booking_id = bookings.id AND attendance.session_date IS NULL;

CREATE INDEX IF NOT EXISTS attendance_codes_booking_id_status_expires_at_idx ON attendance_codes(booking_id, status, expires_at);
CREATE INDEX IF NOT EXISTS attendance_codes_provider_owner_id_code_hash_idx ON attendance_codes(provider_owner_id, code_hash);
CREATE INDEX IF NOT EXISTS attendance_codes_customer_id_created_at_idx ON attendance_codes(customer_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS attendance_booking_id_session_date_key ON attendance(booking_id, session_date);
