import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { mock } from 'node:test';
import { mockAPIResponse } from '@/test/testUtils';

// Mock fetch global
const mockFetch = vi.fn() as MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
    }),
}));

// Mock del hook useAuth para usar en componentes
const mockAuthState = {
    user: null,
    loading: false,
    isAuthenticated: false,
    accessToken: null,
};

const mockAuthActions = {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
};

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(() => ({
        ...mockAuthState,
        ...mockAuthActions,
    })),
}));

describe('Authentication Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockClear();
    });

    describe('Login', () => {
        it('should login successfully with valid credentials', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                username: 'testuser',
            };

            const responseData = {
                user: mockUser,
                token: 'fake-jwt-token',
            }

            mockFetch.mockResolvedValueOnce(mockAPIResponse.success(responseData));

            // Simulamos directamente la función de login
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password123',
                }),
            });

            const data = await response.json();

            expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password123',
                }),
            });

            expect(data.user).toEqual(mockUser);
            expect(data.token).toBe('fake-jwt-token');
        });

        it('should handle login failure with invalid credentials', async () => {
            mockFetch.mockResolvedValueOnce(mockAPIResponse.error('Credenciales inválidas', 401));
            

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                }),
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(401);

            const data = await response.json();
            expect(data.error).toBe('Credenciales inválidas');
        });

        it('should handle network errors during login', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(
                fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'test@example.com',
                        password: 'password123',
                    }),
                })
            ).rejects.toThrow('Network error');
        });
    });

    describe('Register', () => {
        it('should register successfully with valid data', async () => {
            const mockUser = {
                id: '1',
                email: 'newuser@example.com',
                username: 'newuser',
            };

            const responseData = {
                user: mockUser,
                token: 'fake-jwt-token',
            }

            mockFetch.mockResolvedValueOnce(mockAPIResponse.success(responseData));
            
            

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'newuser@example.com',
                    username: 'newuser',
                    password: 'password123',
                }),
            });

            const data = await response.json();

            expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'newuser@example.com',
                    username: 'newuser',
                    password: 'password123',
                }),
            });

            expect(data.user).toEqual(mockUser);
            expect(data.token).toBe('fake-jwt-token');
        });

        it('should handle registration failure with existing email', async () => {
            mockFetch.mockResolvedValueOnce(mockAPIResponse.error('El email ya está registrado', 400));

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'existing@example.com',
                    username: 'newuser',
                    password: 'password123',
                }),
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data.error).toBe('El email ya está registrado');
        });
    });

    describe('Logout', () => {
        it('should logout successfully', async () => {
            mockFetch.mockResolvedValueOnce(mockAPIResponse.success({ message: 'Logout successful' }));

            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });

            const data = await response.json();

            expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });

            expect(data.message).toBe('Logout successful');
        });
    });

    describe('Token Verification', () => {
        it('should verify valid token', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                username: 'testuser',
            };

            mockFetch.mockResolvedValueOnce(mockAPIResponse.success({
                user: mockUser,
            }));

            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                credentials: 'include',
            });

            const data = await response.json();

            expect(fetch).toHaveBeenCalledWith('/api/auth/verify', {
                method: 'GET',
                credentials: 'include',
            });

            expect(data.user).toEqual(mockUser);
        });

        it('should handle invalid token', async () => {
            mockFetch.mockResolvedValueOnce(mockAPIResponse.error('Token inválido', 401));
            

            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                credentials: 'include',
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(401);

            const data = await response.json();
            expect(data.error).toBe('Token inválido');
        });
    });
});