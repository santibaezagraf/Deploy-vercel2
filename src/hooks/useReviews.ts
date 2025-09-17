'use client'
import { useState, useEffect } from 'react';
import { Review } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

export function useReviews(bookId: string) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user, accessToken } = useAuth();

    const isAuthor = (review: Review) => {
        return user?.id ? review.userId === user.id : false;
    };

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
    };

    const loadReviews = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/protected/reviews?bookId=${bookId}`, {
                method: 'GET',
                headers: {
                    // 'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            // console.log("Reviews API Response:", data);

            const transformedReviews = await Promise.all(data.reviews.map(async (review: Review) => {
                const reviewIsAuthor = isAuthor(review);
                return {
                    ...review,
                    isAuthor: reviewIsAuthor,
                    userVote: reviewIsAuthor ? false : await userVote(review)
                };
            }));

            // console.log("Transformed Reviews:", transformedReviews);
            setReviews(transformedReviews);

        } catch (error) {
            console.error('Error cargando reseñas:', error);
            setError('Error al cargar las reseñas');
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const createReview = async (rating: number, comment: string) => {
        try {
            const response = await fetch('/api/protected/reviews', {
                method: 'POST',
                headers: {
                    // 'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    bookId,
                    rating,
                    comment
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear reseña');
            }

            await loadReviews(); // Recargar reviews después de crear
            return true;
        } catch (error) {
            console.error('Error al crear reseña:', error);
            throw error;
        }
    };

    const updateReview = async (reviewId: string, rating: number, comment: string) => {
        try {
            const response = await fetch(`/api/protected/reviews/${reviewId}`, {
                method: 'PUT',
                headers: {
                    // 'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ rating, comment })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al actualizar reseña');
            }

            await loadReviews(); // Recargar reviews después de actualizar
            return true;
        } catch (error) {
            console.error('Error al actualizar reseña:', error);
            throw error;
        }
    };

    const deleteReview = async (reviewId: string) => {
        try {
            const response = await fetch(`/api/protected/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    // 'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar reseña');
            }

            await loadReviews(); // Recargar reviews después de eliminar
            return true;
        } catch (error) {
            console.error('Error al eliminar reseña:', error);
            throw error;
        }
    };

    useEffect(() => {
        loadReviews();
    }, [bookId]);

    return {
        reviews,
        loading,
        error,
        loadReviews,
        createReview,
        updateReview,
        deleteReview,
        setReviews,
        isAuthor
    };
}