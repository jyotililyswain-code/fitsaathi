CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE IF EXISTS "User" RENAME TO users;
ALTER TABLE IF EXISTS "UserProfilePhoto" RENAME TO user_profile_photos;
ALTER TABLE IF EXISTS "SocialVerification" RENAME TO social_verifications;
ALTER TABLE IF EXISTS "UserInterest" RENAME TO user_interests;
ALTER TABLE IF EXISTS "UserAchievement" RENAME TO user_achievements;
ALTER TABLE IF EXISTS "UserSocialLink" RENAME TO user_social_links;
ALTER TABLE IF EXISTS "ConnectionInvite" RENAME TO connection_invites;
ALTER TABLE IF EXISTS "UserBlock" RENAME TO user_blocks;
ALTER TABLE IF EXISTS "Conversation" RENAME TO conversations;
ALTER TABLE IF EXISTS "SocialMessage" RENAME TO social_messages;
ALTER TABLE IF EXISTS "TypingIndicator" RENAME TO typing_indicators;
ALTER TABLE IF EXISTS "Wallet" RENAME TO wallets;
ALTER TABLE IF EXISTS "WalletTransaction" RENAME TO wallet_transactions;
ALTER TABLE IF EXISTS "DailyConnectionCharge" RENAME TO daily_connection_charges;
ALTER TABLE IF EXISTS "PremiumSubscription" RENAME TO premium_subscriptions;
ALTER TABLE IF EXISTS "ProfileView" RENAME TO profile_views;
ALTER TABLE IF EXISTS "SocialReview" RENAME TO social_reviews;
ALTER TABLE IF EXISTS "PushSubscription" RENAME TO push_subscriptions;
ALTER TABLE IF EXISTS "ModerationCase" RENAME TO moderation_cases;
ALTER TABLE IF EXISTS "EmergencyRequest" RENAME TO emergency_requests;
ALTER TABLE IF EXISTS "RefreshToken" RENAME TO refresh_tokens;
ALTER TABLE IF EXISTS "Coach" RENAME TO coaches;
ALTER TABLE IF EXISTS "Dojo" RENAME TO dojos;
ALTER TABLE IF EXISTS "ProviderVerification" RENAME TO verification_requests;
ALTER TABLE IF EXISTS "Seller" RENAME TO seller_accounts;
ALTER TABLE IF EXISTS "Product" RENAME TO products;
ALTER TABLE IF EXISTS "ProductImage" RENAME TO product_images;
ALTER TABLE IF EXISTS "Order" RENAME TO orders;
ALTER TABLE IF EXISTS "OrderItem" RENAME TO order_items;
ALTER TABLE IF EXISTS "Booking" RENAME TO bookings;
ALTER TABLE IF EXISTS "Attendance" RENAME TO attendance;
ALTER TABLE IF EXISTS "Payment" RENAME TO payments;
ALTER TABLE IF EXISTS "RazorpayWebhookEvent" RENAME TO razorpay_webhook_events;
ALTER TABLE IF EXISTS "Review" RENAME TO product_reviews;
ALTER TABLE IF EXISTS "ProviderReview" RENAME TO provider_reviews;
ALTER TABLE IF EXISTS "Notification" RENAME TO notifications;
ALTER TABLE IF EXISTS "Wishlist" RENAME TO wishlists;
ALTER TABLE IF EXISTS "CartItem" RENAME TO cart_items;
ALTER TABLE IF EXISTS "ChatRequest" RENAME TO chat_requests;
ALTER TABLE IF EXISTS "ContactMessage" RENAME TO support_tickets;
ALTER TABLE IF EXISTS "PlatformSettings" RENAME TO platform_settings;
ALTER TABLE IF EXISTS "Report" RENAME TO reports;
ALTER TABLE IF EXISTS "AdminLog" RENAME TO admin_logs;
ALTER TABLE IF EXISTS "RateLimitBucket" RENAME TO rate_limit_buckets;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  parent_id text REFERENCES categories(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seller_products (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  seller_id text NOT NULL REFERENCES seller_accounts(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, product_id)
);

CREATE TABLE IF NOT EXISTS coach_reviews (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  coach_id text NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, user_id)
);

CREATE TABLE IF NOT EXISTS dojo_reviews (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  dojo_id text NOT NULL REFERENCES dojos(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dojo_id, user_id)
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  attendance_id text REFERENCES attendance(id) ON DELETE CASCADE,
  booking_id text REFERENCES bookings(id) ON DELETE CASCADE,
  actor_id text REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS withdraw_requests (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  status text NOT NULL DEFAULT 'pending',
  destination jsonb,
  reviewed_by_id text REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  payment_id text REFERENCES payments(id) ON DELETE SET NULL,
  wallet_transaction_id text REFERENCES wallet_transactions(id) ON DELETE SET NULL,
  type text NOT NULL,
  amount_paise integer NOT NULL,
  status text NOT NULL DEFAULT 'success',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commissions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  payment_id text REFERENCES payments(id) ON DELETE SET NULL,
  booking_id text REFERENCES bookings(id) ON DELETE SET NULL,
  order_id text REFERENCES orders(id) ON DELETE SET NULL,
  seller_id text REFERENCES seller_accounts(id) ON DELETE SET NULL,
  provider_owner_id text REFERENCES users(id) ON DELETE SET NULL,
  amount_paise integer NOT NULL DEFAULT 0,
  rate_percent numeric(5, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reward_levels (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL UNIQUE,
  min_points integer NOT NULL DEFAULT 0,
  benefits jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS martial_art_levels (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  discipline text NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (discipline, name)
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorite_coaches (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id text NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, coach_id)
);

CREATE TABLE IF NOT EXISTS favorite_dojos (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dojo_id text NOT NULL REFERENCES dojos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dojo_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_id text REFERENCES refresh_tokens(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories(parent_id);
CREATE INDEX IF NOT EXISTS seller_products_seller_id_idx ON seller_products(seller_id);
CREATE INDEX IF NOT EXISTS seller_products_product_id_idx ON seller_products(product_id);
CREATE INDEX IF NOT EXISTS coach_reviews_coach_id_created_at_idx ON coach_reviews(coach_id, created_at);
CREATE INDEX IF NOT EXISTS dojo_reviews_dojo_id_created_at_idx ON dojo_reviews(dojo_id, created_at);
CREATE INDEX IF NOT EXISTS attendance_logs_booking_id_created_at_idx ON attendance_logs(booking_id, created_at);
CREATE INDEX IF NOT EXISTS withdraw_requests_user_id_status_idx ON withdraw_requests(user_id, status);
CREATE INDEX IF NOT EXISTS transactions_user_id_created_at_idx ON transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS commissions_status_created_at_idx ON commissions(status, created_at);
CREATE INDEX IF NOT EXISTS customer_addresses_user_id_idx ON customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS favorite_coaches_user_id_idx ON favorite_coaches(user_id);
CREATE INDEX IF NOT EXISTS favorite_dojos_user_id_idx ON favorite_dojos(user_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_expires_at_idx ON sessions(user_id, expires_at);

DROP TRIGGER IF EXISTS categories_set_updated_at ON categories;
CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS seller_products_set_updated_at ON seller_products;
CREATE TRIGGER seller_products_set_updated_at BEFORE UPDATE ON seller_products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS coach_reviews_set_updated_at ON coach_reviews;
CREATE TRIGGER coach_reviews_set_updated_at BEFORE UPDATE ON coach_reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS dojo_reviews_set_updated_at ON dojo_reviews;
CREATE TRIGGER dojo_reviews_set_updated_at BEFORE UPDATE ON dojo_reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS admin_users_set_updated_at ON admin_users;
CREATE TRIGGER admin_users_set_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS withdraw_requests_set_updated_at ON withdraw_requests;
CREATE TRIGGER withdraw_requests_set_updated_at BEFORE UPDATE ON withdraw_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS commissions_set_updated_at ON commissions;
CREATE TRIGGER commissions_set_updated_at BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS reward_levels_set_updated_at ON reward_levels;
CREATE TRIGGER reward_levels_set_updated_at BEFORE UPDATE ON reward_levels FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS martial_art_levels_set_updated_at ON martial_art_levels;
CREATE TRIGGER martial_art_levels_set_updated_at BEFORE UPDATE ON martial_art_levels FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS customer_addresses_set_updated_at ON customer_addresses;
CREATE TRIGGER customer_addresses_set_updated_at BEFORE UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
