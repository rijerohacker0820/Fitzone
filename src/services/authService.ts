import { Platform } from 'react-native';
import { BASE_URL } from '../api/apiClient';

const API_URL = `${BASE_URL}/auth`;

export interface LoginRequest {
    fullName: string; // The API seems to require this according to the user request, though usually login needs email/password. 
                      // Wait, the user provided body: { "fullName": "Usuario Prueba 2", "email": "test2@test.com", "password": "password" }
                      // This looks like a signup body, or a very strange login.
                      // But the endpoint is /login. 
                      // I will follow the user's provided body structure exactly.
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    username: string;
    email: string;
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Login failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};
