'use client'
import { useState, useEffect } from 'react';

interface UserFavoritesProps {
    userId: string;
}

interface FavoriteWithBookInfo {
    _id: string;
    bookId: string;
    notes?: string;
    createdAt: string;
    bookInfo?: {
        title: string;
        authors: string[];
        thumbnail?: string;
        description?: string;
        publishedDate?: string;
        pageCount?: number;
        categories?: string[];
    };
}

export default function UserFavorites({ userId }: UserFavoritesProps) {
    const [favorites, setFavorites] = useState<FavoriteWithBookInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'title'>('recent');

    useEffect(() => {
        loadUserFavorites();
    }, [userId, sortBy]);

    const loadUserFavorites = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/protected/users/favorites?sortBy=${sortBy}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Error al cargar los favoritos');
            }

            const data = await response.json();
            setFavorites(data.favorites || []);

        } catch (error) {
            console.error('Error loading user favorites:', error);
            setError(error instanceof Error ? error.message : 'Error al cargar los favoritos');
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (bookId: string) => {
        try {
            const response = await fetch('/api/protected/favorites', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ bookId })
            });

            if (!response.ok) {
                throw new Error('Error al remover favorito');
            }

            // Actualizar la lista local
            setFavorites(prev => prev.filter(fav => fav.bookId !== bookId));

        } catch (error) {
            console.error('Error removing favorite:', error);
            setError(error instanceof Error ? error.message : 'Error al remover favorito');
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                        <div className="w-full h-40 bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <div className="text-red-600 mb-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>{error}</p>
                </div>
                <button 
                    onClick={loadUserFavorites}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes libros favoritos aún</h3>
                <p className="text-gray-600 mb-4">¡Explora libros y marca tus favoritos con el corazón!</p>
                <a 
                    href="/dashboard" 
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Explorar Libros
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header con filtros */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Mis Libros Favoritos</h3>
                    <p className="text-gray-600">{favorites.length} {favorites.length === 1 ? 'libro' : 'libros'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">Ordenar por:</label>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest' | 'title')}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="recent">Agregados recientemente</option>
                        <option value="oldest">Agregados primero</option>
                        <option value="title">Título A-Z</option>
                    </select>
                </div>
            </div>

            {/* Grid de libros favoritos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((favorite) => (
                    <div key={favorite._id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-lg transition-shadow relative group">
                        {/* Botón de remover */}
                        <button
                            onClick={() => removeFavorite(favorite.bookId)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                            title="Remover de favoritos"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Imagen del libro */}
                        <div className="mb-4">
                            {favorite.bookInfo?.thumbnail ? (
                                <img 
                                    src={favorite.bookInfo.thumbnail} 
                                    alt={favorite.bookInfo.title || 'Libro'}
                                    className="w-full h-48 object-cover rounded-md"
                                />
                            ) : (
                                <div className="w-full h-48 bg-gray-200 rounded-md flex items-center justify-center">
                                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Información del libro */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900 line-clamp-2">
                                {favorite.bookInfo?.title || `Libro ID: ${favorite.bookId}`}
                            </h4>
                            
                            {favorite.bookInfo?.authors && (
                                <p className="text-sm text-gray-600">
                                    {favorite.bookInfo.authors.join(', ')}
                                </p>
                            )}

                            {favorite.bookInfo?.description && (
                                <p className="text-xs text-gray-500 line-clamp-3">
                                    {favorite.bookInfo.description}
                                </p>
                            )}

                            {/* Metadatos */}
                            <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                                <span>Agregado: {formatDate(favorite.createdAt)}</span>
                                {favorite.bookInfo?.pageCount && (
                                    <span>{favorite.bookInfo.pageCount} páginas</span>
                                )}
                            </div>

                            {/* Categorías */}
                            {favorite.bookInfo?.categories && (
                                <div className="flex flex-wrap gap-1 pt-2">
                                    {favorite.bookInfo.categories.slice(0, 2).map((category, index) => (
                                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                            {category}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Notas del usuario */}
                            {favorite.notes && (
                                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-xs text-gray-700">
                                        <span className="font-medium">Nota:</span> {favorite.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}