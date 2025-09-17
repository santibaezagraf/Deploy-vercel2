'use client'

import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export default function Navbar() {
    const { user, logout } = useAuth()

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error('Error al cerrar sesión:', error)
        }
    }

    if (!user) return null

    return (
        <nav className="bg-white shadow-lg border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link 
                            href="/" 
                            className="text-xl font-bold text-indigo-600 hover:text-indigo-700"
                        >
                            Book Reviews
                        </Link>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/dashboard"
                            className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Inicio
                        </Link>
                        <Link
                            href="/profile"
                            className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Mi Perfil
                        </Link>
                        <span className="text-gray-700">
                            Hola, <span className="font-medium">{user.username}</span>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}
