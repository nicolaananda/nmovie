CREATE TABLE "CustomSubtitle" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tmdbId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "seasonNumber" INTEGER,
    "episodeNumber" INTEGER,
    "language" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomSubtitle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CustomSubtitle_tmdbId_status_idx" ON "CustomSubtitle"("tmdbId", "status");
CREATE INDEX "CustomSubtitle_userId_idx" ON "CustomSubtitle"("userId");
ALTER TABLE "CustomSubtitle" ADD CONSTRAINT "CustomSubtitle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
