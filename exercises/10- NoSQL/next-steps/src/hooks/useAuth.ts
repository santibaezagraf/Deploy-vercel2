'use client'
import { access } from 'fs'
import { useState, useEffect } from 'react'

interface User {
    id: string
    email: string
    username: string
    createdAt?: string
}

interface AuthState {
    user: User | null
    loading: boolean
    isAuthenticated: boolean,
    accessToken?: string | null
}

interface LoginData {
    email: string
    password: string
}

interface RegisterData {
    email: string
    password: string
    username: string
}

interface AuthResponse {
    success: boolean
    error?: string
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        isAuthenticated: false,
        accessToken: null
    })

    // Verificar autenticación al cargar
    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            setState(prev => ({ ...prev, loading: true }))
            
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            })
            
            if (response.ok) {
                const data = await response.json()
                setState({
                    user: data.user,
                    loading: false,
                    isAuthenticated: true
                })
            } else {
                setState({
                    user: null,
                    loading: false,
                    isAuthenticated: false
                })
            }
        } catch (error) {
            console.error('Error checking auth:', error)
            setState({
                user: null,
                loading: false,
                isAuthenticated: false
            })
        }
    }

    const login = async (loginData: LoginData): Promise<AuthResponse> => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(loginData)
            })

            const data = await response.json()
            
            if (response.ok) {
                setState({
                    user: data.user,
                    loading: false,
                    isAuthenticated: true
                })
                return { success: true }
            } else {
                return { success: false, error: data.error }
            }
        } catch (error) {
            console.error('Login error:', error)
            return { success: false, error: 'Error de conexión' }
        }
    }

    const register = async (registerData: RegisterData): Promise<AuthResponse> => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(registerData)
            })

            const data = await response.json()
            
            if (response.ok) {
                setState({
                    user: data.user,
                    loading: false,
                    isAuthenticated: true
                })
                return { success: true }
            } else {
                return { success: false, error: data.error }
            }
        } catch (error) {
            console.error('Register error:', error)
            return { success: false, error: 'Error de conexión' }
        }
    }

    const logout = async (): Promise<void> => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            })
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            setState({
                user: null,
                loading: false,
                isAuthenticated: false
            })
        }
    }

    return {
        user: state.user,
        loading: state.loading,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        login,
        register,
        logout,
        checkAuth,
    }
}
