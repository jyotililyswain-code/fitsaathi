-- Attendance OTP codes replace QR attendance tokens.
CREATE TABLE IF NOT EXISTS attendance_codes (
  id TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "providerOwnerId" TEXT NOT NULL,
  "providerProfileId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "sessionDate" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attendance_codes_booking_id_fkey FOREIGN KEY ("bookingId") REFERENCES bookings(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT attendance_codes_customer_id_fkey FOREIGN KEY ("customerId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE attendance ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE attendance ALTER COLUMN "nonceHash" DROP NOT NULL;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'OTP_CODE';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS "sessionDate" TEXT;
UPDATE attendance SET "sessionDate" = bookings."preferredDate" FROM bookings WHERE attendance."bookingId" = bookings.id AND attendance."sessionDate" IS NULL;

CREATE INDEX IF NOT EXISTS attendance_codes_booking_id_status_expires_at_idx ON attendance_codes("bookingId", status, "expiresAt");
CREATE INDEX IF NOT EXISTS attendance_codes_provider_owner_id_code_hash_idx ON attendance_codes("providerOwnerId", "codeHash");
CREATE INDEX IF NOT EXISTS attendance_codes_customer_id_created_at_idx ON attendance_codes("customerId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS attendance_booking_id_session_date_key ON attendance("bookingId", "sessionDate");
