-- Recovery migration: adds any columns/tables that may have been missed
-- All statements use IF NOT EXISTS so they are safe to run multiple times.

-- AttendanceStatus enum (may already exist)
DO $$ BEGIN
  CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'makeup');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Students: add scheduling columns
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "week_days" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "course_start_at" TIMESTAMP(3);
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "course_end_at" TIMESTAMP(3);

-- Lessons: make topic_id optional (safe if already nullable)
ALTER TABLE "lessons" ALTER COLUMN "topic_id" DROP NOT NULL;

-- Fix topic_id FK to allow SET NULL (drop old RESTRICT, add SET NULL)
DO $$ BEGIN
  ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "lessons_topic_id_fkey";
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_topic_id_fkey"
    FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- attendance_records
CREATE TABLE IF NOT EXISTS "attendance_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "attendance_records_student_id_idx" ON "attendance_records"("student_id");
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_records_student_id_date_key" ON "attendance_records"("student_id", "date");
DO $$ BEGIN
  ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- class_sessions
CREATE TABLE IF NOT EXISTS "class_sessions" (
    "id" TEXT NOT NULL,
    "class_group_id" TEXT NOT NULL,
    "teacher_user_id" TEXT NOT NULL,
    "held_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "topic_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "class_sessions_class_group_id_held_at_idx" ON "class_sessions"("class_group_id", "held_at" DESC);
DO $$ BEGIN
  ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_class_group_id_fkey"
    FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_teacher_user_id_fkey"
    FOREIGN KEY ("teacher_user_id") REFERENCES "teacher_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_topic_id_fkey"
    FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- session_attendances
CREATE TABLE IF NOT EXISTS "session_attendances" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "grade" DOUBLE PRECISION,
    CONSTRAINT "session_attendances_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "session_attendances_session_id_idx" ON "session_attendances"("session_id");
CREATE INDEX IF NOT EXISTS "session_attendances_student_id_idx" ON "session_attendances"("student_id");
CREATE UNIQUE INDEX IF NOT EXISTS "session_attendances_session_id_student_id_key" ON "session_attendances"("session_id", "student_id");
DO $$ BEGIN
  ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
