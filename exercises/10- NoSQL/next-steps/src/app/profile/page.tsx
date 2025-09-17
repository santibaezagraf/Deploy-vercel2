'use client'
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import UserReviewsHistory from '../components/profile/UserReviewsHistory';
import UserFavorites from '../components/profile/UserFavorites';
import UserProfileInfo from '../components/profile/UserProfileInfo';

type TabType = 'reviews' | 'favorites' | 'profile';

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<TabType>('reviews');
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="text-center py-12">
                    <div className="mb-4">
                        <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
                    <p className="text-gray-600 mb-4">Necesitas iniciar sesión para ver tu perfil</p>
                    <a href="/auth/login" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Iniciar Sesión
                    </a>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'reviews', label: 'Mis Reseñas', icon: '📝' },
        { id: 'favorites', label: 'Favoritos', icon: '❤️' },
        { id: 'profile', label: 'Perfil', icon: '👤' }
    ] as const;

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header del perfil */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
                        <p className="text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">Miembro desde {new Date(user.createdAt || Date.now()).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}</p>
                    </div>
                </div>
            </div>

            {/* Navegación por tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Contenido de los tabs */}
                <div className="p-6">
                    {activeTab === 'reviews' && <UserReviewsHistory userId={user.id} />}
                    {activeTab === 'favorites' && <UserFavorites userId={user.id} />}
                    {activeTab === 'profile' && <UserProfileInfo user={user} />}
                </div>
            </div>
        </div>
    );
}