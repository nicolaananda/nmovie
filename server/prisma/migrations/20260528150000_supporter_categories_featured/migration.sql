-- Migration: supporter flag, library categories, featured content
-- Adds:
--   * User.isSupporter / User.supporterSince  (donation badge)
--   * LibraryCategory enum + LibraryItem.category
--   * FeaturedContent table for admin-curated homepage hero
--
-- Safe to apply against an existing database:
--   * IF NOT EXISTS / DO blocks make the migration idempotent.
--   * Existing LibraryItem rows default to WATCHLIST.

-- 1. LibraryCategory enum (skip if already created).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LibraryCategory') THEN
        CREATE TYPE "LibraryCategory" AS ENUM ('WATCHLIST', 'FAVORITE', 'WATCHED');
    END IF;
END$$;

-- 2. User.isSupporter + supporterSince.
ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "isSupporter" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "supporterSince" TIMESTAMP(3);

-- 3. LibraryItem.category.
ALTER TABLE "LibraryItem"
    ADD COLUMN IF NOT EXISTS "category" "LibraryCategory" NOT NULL DEFAULT 'WATCHLIST';

CREATE INDEX IF NOT EXISTS "LibraryItem_userId_category_idx"
    ON "LibraryItem" ("userId", "category");

-- 4. FeaturedContent table.
CREATE TABLE IF NOT EXISTS "FeaturedContent" (
    "id"          SERIAL          NOT NULL,
    "tmdbId"      TEXT            NOT NULL,
    "mediaType"   TEXT            NOT NULL,
    "title"       TEXT            NOT NULL,
    "description" TEXT,
    "banner"      TEXT,
    "poster"      TEXT,
    "badge"       TEXT,
    "startsAt"    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt"      TIMESTAMP(3),
    "isActive"    BOOLEAN         NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)    NOT NULL,

    CONSTRAINT "FeaturedContent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FeaturedContent_isActive_startsAt_endsAt_idx"
    ON "FeaturedContent" ("isActive", "startsAt", "endsAt");
