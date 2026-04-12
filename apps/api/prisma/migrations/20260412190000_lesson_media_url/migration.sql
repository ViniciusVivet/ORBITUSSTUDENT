-- AlterTable: adiciona coluna media_url na tabela lessons
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "media_url" TEXT;
