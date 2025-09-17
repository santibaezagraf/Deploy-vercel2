'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface AuthGuardProps {
    children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // No redirigir si estamos en rutas de autenticación
        const isAuthRoute = pathname === '/login' || pathname === '/register'
        
        if (!loading && !user && !isAuthRoute) {
            router.push('/login')
        }
    }, [user, loading, router, pathname])

    // Mostrar loading mientras se verifica la autenticación
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

    // Si no está autenticado y no está en ruta de auth, no mostrar nada (se redirige)
    const isAuthRoute = pathname === '/login' || pathname === '/register'
    if (!user && !isAuthRoute) {
        return null
    }

    return <>{children}</>
}
