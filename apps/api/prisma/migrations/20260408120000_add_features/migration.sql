-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'makeup');

-- AlterTable students: add week scheduling and course dates
ALTER TABLE "students" ADD COLUMN "week_days" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "students" ADD COLUMN "course_start_at" TIMESTAMP(3);
ALTER TABLE "students" ADD COLUMN "course_end_at" TIMESTAMP(3);

-- AlterTable lessons: make topic_id optional
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_topic_id_fkey";
ALTER TABLE "lessons" ALTER COLUMN "topic_id" DROP NOT NULL;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable attendance_records
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable class_sessions
CREATE TABLE "class_sessions" (
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

-- CreateTable session_attendances
CREATE TABLE "session_attendances" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "grade" DOUBLE PRECISION,

    CONSTRAINT "session_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_records_student_id_idx" ON "attendance_records"("student_id");
CREATE UNIQUE INDEX "attendance_records_student_id_date_key" ON "attendance_records"("student_id", "date");

CREATE INDEX "class_sessions_class_group_id_held_at_idx" ON "class_sessions"("class_group_id", "held_at" DESC);

CREATE INDEX "session_attendances_session_id_idx" ON "session_attendances"("session_id");
CREATE INDEX "session_attendances_student_id_idx" ON "session_attendances"("student_id");
CREATE UNIQUE INDEX "session_attendances_session_id_student_id_key" ON "session_attendances"("session_id", "student_id");

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_teacher_user_id_fkey" FOREIGN KEY ("teacher_user_id") REFERENCES "teacher_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
