'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
    const router = useRouter()
    const { isAuthenticated, loading } = useAuth()

    useEffect(() => {
        if (!loading) {
            if (isAuthenticated) {
                // Si está logueado, redirigir a la aplicación protegida
                router.push('/dashboard')
            } else {
                // Si no está logueado, redirigir a login
                router.push('/login')
            }

        }
    }, [isAuthenticated, loading, router])

    // Mientras se verifica la autenticación, mostrar loading
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando...</p>
                </div>
            </div>
        )
    }

    return null
}