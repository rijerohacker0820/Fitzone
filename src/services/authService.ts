import apiClient from "../api/apiClient";

// ── Login ──────────────────────────────────────────────
// POST /api/auth/login — only email + password
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username?: string;
  email?: string;
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  // Send ONLY email and password — never fullName
  const response = await apiClient.post("/auth/login", {
    email: data.email,
    password: data.password,
  });
  return response.data;
};

// ── Register ───────────────────────────────────────────
// POST /api/auth/register
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  documentId: string;
  gymId?: string;
}

export interface RegisterResponse {
  token?: string;
  message?: string;
}

export const register = async (
  data: RegisterRequest,
): Promise<RegisterResponse> => {
  // Clean: only send fields that have values
  const payload: Record<string, string> = {
    fullName: data.fullName,
    email: data.email,
    password: data.password,
    documentId: data.documentId,
  };

  if (data.gymId && data.gymId.trim() !== "") {
    payload.gymId = data.gymId.trim();
  }

  const response = await apiClient.post("/auth/register", payload);
  return response.data;
};

// ── Forgot Password ────────────────────────────────────
// POST /api/auth/forgot-password
export const forgotPassword = async (email: string): Promise<void> => {
  await apiClient.post("/auth/forgot-password", { email });
};

// ── Change Password ────────────────────────────────────
// POST /api/auth/change-password
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (
  data: ChangePasswordRequest,
): Promise<void> => {
  await apiClient.post("/auth/change-password", data);
};
