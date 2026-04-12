ALTER TABLE "class_groups" ADD COLUMN IF NOT EXISTS "teacher_user_id" TEXT;

UPDATE "class_groups"
SET "teacher_user_id" = (
  SELECT "id" FROM "teacher_users" ORDER BY "created_at" ASC LIMIT 1
)
WHERE "teacher_user_id" IS NULL;

ALTER TABLE "class_groups" ALTER COLUMN "teacher_user_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "class_groups_teacher_user_id_idx" ON "class_groups"("teacher_user_id");

DO $$ BEGIN
  ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_teacher_user_id_fkey"
    FOREIGN KEY ("teacher_user_id") REFERENCES "teacher_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
