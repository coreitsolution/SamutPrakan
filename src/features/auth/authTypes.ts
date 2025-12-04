import { User } from "../types";

export interface AuthData {
  token: string | null;
  isAuthenticated: boolean;
  userInfo: User | null;
  userUid: string;
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  statusCode: number
  status: string
  success: boolean
  message: string
  user: {
    id: number
    uid: string
  }
}

export interface RefreshTokenResponse {
  accessToken: string
}

export interface UserInfo {
  id: string
  username: string
  password: string
  email: string
  phone: string
  role: string
  visible: boolean
  active: boolean
  deleted: boolean
  deleted_by_id: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}