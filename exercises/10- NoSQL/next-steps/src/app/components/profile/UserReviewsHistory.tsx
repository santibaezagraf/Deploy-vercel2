'use client'
import { useState, useEffect } from 'react';
import { Review } from '@/lib/types';
import StarRating from '@/app/components/reviews/StarRating';

interface UserReviewsHistoryProps {
    userId: string;
}

interface ReviewWithBook extends Review {
    bookInfo?: {
        title: string;
        authors?: string[];
        thumbnail?: string;
    }
}

export default function UserReviewsHistory({ userId }: UserReviewsHistoryProps) {
    const [reviews, setReviews] = useState<ReviewWithBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'oldest'>('recent');

    useEffect(() => {
        loadUserReviews();
    }, [userId, sortBy]);

    const loadUserReviews = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/protected/users/reviews?sortBy=${sortBy}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Error al cargar las reseñas');
            }

            const data = await response.json();
            setReviews(data.reviews || []);

        } catch (error) {
            console.error('Error loading user reviews:', error);
            setError(error instanceof Error ? error.message : 'Error al cargar las reseñas');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                        <div className="flex space-x-4">
                            <div className="w-16 h-20 bg-gray-200 rounded"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                            </div>
                        </div>
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
                    onClick={loadUserReviews}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No has escrito reseñas aún</h3>
                <p className="text-gray-600 mb-4">¡Comienza explorando libros y compartiendo tus opiniones!</p>
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
                    <h3 className="text-lg font-semibold text-gray-900">Mis Reseñas</h3>
                    <p className="text-gray-600">{reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">Ordenar por:</label>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating' | 'oldest')}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="recent">Más recientes</option>
                        <option value="oldest">Más antiguas</option>
                        <option value="rating">Calificación</option>
                    </select>
                </div>
            </div>

            {/* Lista de reseñas */}
            <div className="space-y-4">
                {reviews.map((review, index) => (
                    <div key={review.id || `review-${index}`} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                        <div className="flex space-x-4">
                            {/* Thumbnail del libro */}
                            <div className="flex-shrink-0">
                                {review.bookInfo?.thumbnail ? (
                                    <img 
                                        src={review.bookInfo.thumbnail} 
                                        alt={review.bookInfo.title || 'Libro'}
                                        className="w-16 h-20 object-cover rounded shadow-sm"
                                    />
                                ) : (
                                    <div className="w-16 h-20 bg-gray-200 rounded shadow-sm flex items-center justify-center">
                                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Contenido de la reseña */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-gray-900 truncate">
                                            {review.bookInfo?.title || `Libro ID: ${review.bookId}`}
                                        </h4>
                                        {review.bookInfo?.authors && (
                                            <p className="text-sm text-gray-600">
                                                {review.bookInfo.authors.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <StarRating rating={review.rating} readOnly size="sm" />
                                        <span>•</span>
                                        <span>{formatDate(review.createdAt)}</span>
                                    </div>
                                </div>

                                <p className="text-gray-700 text-sm mb-3">{review.comment}</p>

                                {/* Estadísticas de votación */}
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                        </svg>
                                        <span>{review.likesCount} likes</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4 text-red-500 transform rotate-180" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                        </svg>
                                        <span>{review.dislikesCount} dislikes</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}