export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: { id: string; email: string; role: string };
}

export interface CreateStudentRequest {
  displayName: string;
  fullName?: string;
  classGroupId?: string;
  avatarType: 'template' | 'emoji' | 'photo';
  avatarValue: string;
}

export interface ListStudentsQuery {
  search?: string;
  classGroupId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}
