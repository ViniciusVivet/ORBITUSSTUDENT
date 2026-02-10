export type Role = 'ADMIN' | 'VIEWER';

export type StudentStatus = 'active' | 'inactive' | 'archived';

export type BlockerStatus = 'active' | 'resolved';

export type GoalStatus = 'pending' | 'in_progress' | 'completed';

export type AvatarType = 'template' | 'emoji' | 'photo';

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
