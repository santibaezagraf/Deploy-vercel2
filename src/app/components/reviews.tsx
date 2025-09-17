'use client'
import { useState, useEffect, useTransition } from 'react';
import { Review } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

interface BookReviewsProps {
    bookId: string;
}

const cleanReview: Partial<Review> = {
    rating: 5,
    comment: '',
};

export default function BookReviews({ bookId }: BookReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [newReview, setNewReview] = useState<Partial<Review>>(cleanReview);
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [votingInProgress, setVotingInProgress] = useState<Set<string>>(new Set());
    const { user, accessToken } = useAuth();
    const [voteError, setVoteError] = useState<{ message: string, reviewId: string } | null>(null);
    const [creationError, setCreationError] = useState<string | null>(null);
    
    // Estados para edición de reviews
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editReview, setEditReview] = useState<Partial<Review>>(cleanReview);

    useEffect(() => {
        loadReviews();
    }, [bookId]);

    const isAuthor = (review: Review) => {
        return user?.id ? review.userId === user.id : false;
    }

    const userVote = async (review: Review) => {
        try {
            const response = await fetch(`/api/protected/votes?reviewId=${review.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Error al obtener voto del usuario');

            const data = await response.json();
            return data.userVote;

        } catch (error) {
            console.error("Error fetching user vote:", error);
            return null;
        }
    }

    const loadReviews = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`/api/protected/reviews?bookId=${bookId}`,  {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Reviews API Response:", data); // Depuración

            const transformedReviews = await Promise.all(data.reviews.map(async (review: Review) => {
                const reviewIsAuthor = isAuthor(review);
                return {
                    ...review,
                    isAuthor: reviewIsAuthor,
                    userVote: reviewIsAuthor ? false : await userVote(review)
                };
            }));

            // console.log("Transformed Reviews:", transformedReviews); // Depuración

            setReviews(transformedReviews);

        } catch (error) {
            console.error('Error cargando reseñas:', error);
            setError('Error al cargar las reseñas');
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReview.rating || !newReview.comment?.trim() || !user) return;

        startTransition(async () => {
            try {
                const reviewData = {
                    bookId,
                    username: user.username,
                    rating: newReview.rating!,
                    comment: newReview.comment!.trim()
                };

                const response = await fetch('/api/protected/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(reviewData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    setError(errorData.message);
                    throw new Error(errorData.error || 'Error al agregar reseña');
                }

                await loadReviews(); // Recargar Reviews
                setNewReview(cleanReview);
                setShowReviewForm(false);
            } catch (error) {
                console.error('Error al agregar reseña:', error);
                setCreationError(error instanceof Error ? error.message : 'Error al agregar reseña');
            }
        });
    };

    const handleVote = async (reviewId: string, voteType: 'like' | 'dislike') => {
        // Verificar si el usuario quiere votar una review propia
        const review = reviews.find(r => r.id === reviewId);
        console.log("Review found for voting:", review?.isAuthor);

        if (review) {
            // console.log("Review found for voting:", review.isAuthor);

            if (review.isAuthor === undefined) {
                console.log("Determining if user is author for review:", reviewId);
                review.isAuthor = isAuthor(review);
            }

            if (review.isAuthor) {
                console.log("No se puede votar la propia reseña:", reviewId);
                setVoteError({ message: "No puedes votar tu propia reseña.", reviewId });
                setTimeout(() => {
                    setVoteError(null);
                }, 4000);

                return; // No permitir votar la propia reseña
            }
        } else {
            console.log("Review not found for voting:", reviewId);
        }

        // Prevenir votos múltiples al mismo review
        if (votingInProgress.has(reviewId)) {
            console.log("Vote in progress for review:", reviewId);
            return; // Ya hay un voto en progreso para este review
        }

        try {
            // Marcar que el voto está en progreso
            setVotingInProgress(prev => new Set(prev).add(reviewId));

            // Actualización optimista - actualizar UI inmediatamente
            setReviews(prevReviews => 
                prevReviews.map(review => {
                    if (review.id === reviewId) {
                        const currentVote = review.userVote;
                        let newLikesCount = review.likesCount;
                        let newDislikesCount = review.dislikesCount;
                        let newUserVote: 'like' | 'dislike' | null = voteType;

                        console.log("Current vote:", currentVote, "New vote:", newUserVote);

                        // Lógica para actualizar contadores
                        if (currentVote === voteType) {
                            // Si vota lo mismo, remover voto
                            newUserVote = null;
                            if (voteType === 'like') {
                                newLikesCount = Math.max(0, newLikesCount - 1);
                            } else {
                                newDislikesCount = Math.max(0, newDislikesCount - 1);
                            }
                        } else if (currentVote === null) {
                            // Si no había voto, agregar
                            if (voteType === 'like') {
                                newLikesCount += 1;
                            } else {
                                newDislikesCount += 1;
                            }
                        } else {
                            // Si cambia de like a dislike o viceversa
                            if (voteType === 'like') {
                                newLikesCount += 1;
                                newDislikesCount = Math.max(0, newDislikesCount - 1);
                            } else {
                                newDislikesCount += 1;
                                newLikesCount = Math.max(0, newLikesCount - 1);
                            }
                        }

                        return {
                            ...review,
                            likesCount: newLikesCount,
                            dislikesCount: newDislikesCount,
                            userVote: newUserVote
                        };
                    }
                    return review;
                })
            );

            // Hacer la petición al servidor
            const response = await fetch('/api/protected/votes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    reviewId, 
                    like: voteType === 'like',
                })
            })

            if (!response.ok) {
                const errorData = await response.json();
            
                // Manejar error específico de autor votando su propia review
                if (errorData.error === 'You cannot vote your own review' || 
                    errorData.message?.includes('cannot vote your own review') ||
                    response.status === 403) {
                    
                    // Revertir la actualización optimista sin recargar todas las reviews
                    setReviews(prevReviews => 
                        prevReviews.map(rev => {
                            if (rev.id === reviewId) {
                                // Encontrar el review original antes de la actualización optimista
                                const originalReview = reviews.find(r => r.id === reviewId);
                                return originalReview ? {
                                    ...rev,
                                    likesCount: originalReview.likesCount,
                                    dislikesCount: originalReview.dislikesCount,
                                    userVote: originalReview.userVote,
                                    isAuthor: true // Marcar como autor para futuras verificaciones
                                } : rev;
                            }
                            return rev;
                        })
                    );
                
                    setVoteError({ message: "No puedes votar tu propia reseña.", reviewId });
                    return; // No recargar las reviews
                }
            
                // Para otros errores, recargar reviews
                await loadReviews();
                setError(errorData.message || 'Error al votar');
                throw new Error(errorData.message || 'Error al votar');
            }

            const data = await response.json();
            console.log("Vote API Response:", data); // Depuración

            // Sincronizar con la respuesta del servidor (por si hay diferencias)
            setReviews(prevReviews => 
                prevReviews.map(review => 
                    review.id === reviewId 
                        ? { 
                            ...review, 
                            likesCount: data.review?.likesCount || data.likesCount || review.likesCount,
                            dislikesCount: data.review?.dislikesCount || data.dislikesCount || review.dislikesCount,
                            userVote: data.userVote !== undefined ? data.userVote : review.userVote
                        }
                        : review
                )
            );

        } catch (error) {
            console.error('Error al votar:', error);
            setError(error instanceof Error ? error.message : 'Error al votar');
        } finally {
            // Quitar el reviewId del set de votos en progreso
            setVotingInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(reviewId);
                return newSet;
            });
        }
    };

    // Funciones para editar y eliminar reviews
    const handleEditReview = (review: Review) => {
        setEditingReviewId(review.id);
        setEditReview({
            rating: review.rating,
            comment: review.comment
        });
    };

    const handleCancelEdit = () => {
        setEditingReviewId(null);
        setEditReview(cleanReview);
    };

    const handleSaveEdit = async () => {
        if (!editingReviewId || !editReview.rating || !editReview.comment?.trim()) {
            return;
        }

        console.log('Guardar edición:', { reviewId: editingReviewId, ...editReview });

        try {
            const response = await fetch(`/api/protected/reviews/${editingReviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editReview)
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Error al guardar edición');
                console.error('Error al guardar edición:', errorData);
                return;
            }

        } catch (error) {
            console.error('Error al guardar edición:', error);
            setError(error instanceof Error ? error.message : 'Error al guardar edición');
        } finally {
            // Por ahora solo cerrar el editor
            setEditingReviewId(null);
            setEditReview(cleanReview);
            await loadReviews(); // Recargar reviews después de guardar
        }
    }

    const handleDeleteReview = async (reviewId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
            
            const response = await fetch(`/api/protected/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Error al eliminar reseña');
                console.error('Error al eliminar reseña:', errorData);
                return;
            }

            await loadReviews(); // Recargar reviews después de eliminar
            setError(null);
        }
    };

    const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

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
                <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando reseñas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="text-center py-4 text-red-600">
                    <p>{error}</p>
                    <button 
                        onClick={loadReviews}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                    Reseñas ({reviews.length})
                </h3>
                {reviews.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm text-gray-600">
                            {averageRating.toFixed(1)} promedio
                        </span>
                    </div>
                )}
            </div>

            {user && (
                !showReviewForm ? (
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                        ✍️ Escribir reseña
                    </button>
                ) : (
                    <form onSubmit={handleSubmitReview} className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Calificación
                            </label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setNewReview({ ...newReview, rating: star })}
                                        className={`text-2xl ${
                                            star <= (newReview.rating || 0) 
                                                ? 'text-yellow-500' 
                                                : 'text-gray-300'
                                        } hover:text-yellow-400 transition-colors`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comentario
                            </label>
                            <textarea
                                value={newReview.comment || ''}
                                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={3}
                                placeholder="Comparte tu opinión sobre este libro..."
                                required
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={isPending || !newReview.comment?.trim()}
                                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                                {isPending ? 'Publicando...' : 'Publicar reseña'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowReviewForm(false);
                                    setNewReview(cleanReview);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                        </div>

                        {creationError && (
                            <p className="text-red-600 text-sm">{creationError}</p>
                        )}
                    </form>
                    ) 
                )}
                    


                

            <div className="space-y-3 max-h-80 overflow-y-auto">
                
                {reviews && reviews.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                        Aún no hay reseñas para este libro. ¡Sé el primero en escribir una!
                    </p>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                            {review.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-semibold text-gray-800 text-sm">{review.username}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <span
                                                    key={star}
                                                    className={`text-sm ${
                                                        star <= review.rating 
                                                            ? 'text-yellow-500' 
                                                            : 'text-gray-300'
                                                    }`}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {formatDate(review.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Botones de editar/eliminar para reviews propias */}
                                {isAuthor(review) && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditReview(review)}
                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar reseña"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteReview(review.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar reseña"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Contenido de la review */}
                            {editingReviewId === review.id ? (
                                /* Modo edición */
                                <div className="mb-3">
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Calificación
                                        </label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setEditReview(prev => ({ ...prev, rating: star }))}
                                                    className={`text-2xl transition-colors ${
                                                        star <= (editReview.rating || 0) 
                                                            ? 'text-yellow-500 hover:text-yellow-600' 
                                                            : 'text-gray-300 hover:text-yellow-400'
                                                    }`}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Comentario
                                        </label>
                                        <textarea
                                            value={editReview.comment}
                                            onChange={(e) => setEditReview(prev => ({ ...prev, comment: e.target.value }))}
                                            placeholder="Escribe tu reseña aquí..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            rows={3}
                                        />
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveEdit}
                                            disabled={!editReview.rating || !editReview.comment?.trim()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                                        >
                                            Guardar
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Modo normal */
                                <p className="text-gray-700 text-sm mb-3">{review.comment}</p>
                            )}
                            
                            {/* Botones de votación - solo se muestran cuando no se está editando */}
                            {editingReviewId !== review.id && (
                                <div className="flex items-center gap-4 text-sm">
                                <button
                                    onClick={() => handleVote(review.id, 'like')}
                                    disabled={votingInProgress.has(review.id) } //|| review.isAuthor}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-150 focus:outline-none active:scale-95 ${
                                        review.userVote === 'like'
                                            ? 'border-green-500 bg-green-100 text-green-700 shadow-sm'
                                            : 'border-gray-300 bg-white text-gray-600 hover:border-green-400 hover:text-green-600 hover:bg-green-50 focus:ring-2 focus:ring-green-300'
                                    }`}
                                >
                                    <svg 
                                        className="w-4 h-4" 
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                    </svg>
                                    <span className="font-medium">{review.likesCount}</span>
                                </button>
                                <button
                                    onClick={() => handleVote(review.id, 'dislike')}
                                    disabled={votingInProgress.has(review.id) }  //|| review.isAuthor}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-150 focus:outline-none active:scale-95 ${
                                        review.userVote === 'dislike'
                                            ? 'border-red-500 bg-red-100 text-red-700 shadow-sm'
                                            : 'border-gray-300 bg-white text-gray-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-300'
                                    }`}
                                >
                                    <svg 
                                        className="w-4 h-4 transform rotate-180" 
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                    </svg>
                                    <span className="font-medium">{review.dislikesCount}</span>
                                </button>
                                {voteError && voteError.reviewId === review.id && (
                                    <span className="text-red-600 ml-2">{voteError.message}</span>
                                )}
                                </div>
                            )}
                        </div>
                    ))
                )}
                
            </div>
        </div>
    );
}
