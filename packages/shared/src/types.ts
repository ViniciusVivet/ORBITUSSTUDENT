export type Role = 'ADMIN' | 'VIEWER';

export type StudentStatus = 'active' | 'inactive' | 'archived';

export type BlockerStatus = 'active' | 'resolved';

export type GoalStatus = 'pending' | 'in_progress' | 'completed';

export type AvatarType = 'template' | 'emoji' | 'photo';

/** Sinais para triagem no Roster (badges e fila de atenção). */
export interface StudentAttentionHints {
  activeBlockersCount: number;
  overdueGoalsCount: number;
  /** `null` = nunca teve aula registrada */
  daysSinceLastLesson: number | null;
}

export interface AttentionQueueItem {
  studentId: string;
  displayName: string;
  classGroup: { id: string; name: string } | null;
  reasons: string[];
  score: number;
}

export interface StudentListItem {
  id: string;
  displayName: string;
  fullName?: string | null;
  avatarType: AvatarType;
  avatarValue: string;
  photoUrl?: string | null;
  level: number;
  xp: number;
  status: StudentStatus;
  classGroup?: { id: string; name: string } | null;
  attentionHints?: StudentAttentionHints;
  weekDays?: number[];
  courseStartAt?: string | null;
  courseEndAt?: string | null;
}

export interface StudentSummary {
  student: StudentListItem;
  lastLessons: Array<{
    id: string;
    heldAt: string;
    durationMinutes: number;
    topicName: string;
    rating: number;
    xpEarned: number;
  }>;
  skillBars: Array<{
    skillId: string;
    skillName: string;
    color: string | null;
    currentXp: number;
    level: number;
  }>;
  activeBlockersCount: number;
  activeGoalsCount: number;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'makeup';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  note?: string | null;
  createdAt: string;
}

export interface ClassSessionItem {
  id: string;
  classGroupId: string;
  heldAt: string;
  durationMinutes: number;
  topicName?: string | null;
  notes?: string | null;
  createdAt: string;
  attendanceCount: number;
}

export interface ClassGroupDetail {
  id: string;
  name: string;
  course?: string | null;
  academicPeriod?: string | null;
  studentCount: number;
  students: StudentListItem[];
  sessions: ClassSessionItem[];
}
