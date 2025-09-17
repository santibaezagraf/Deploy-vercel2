'use client'
import { Dispatch, SetStateAction, useState } from 'react';
import { Review } from '@/lib/types';
import { useReviews } from './useReviews';

interface UseVotingParams {
    reviews: Review[];
    setReviews: Dispatch<SetStateAction<Review[]>>;
}

export function useVoting({ reviews, setReviews }: UseVotingParams) {
    const [votingInProgress, setVotingInProgress] = useState<Set<string>>(new Set());
    const [voteError, setVoteError] = useState<{ message: string, reviewId: string } | null>(null);
    const { loadReviews } = useReviews(''); // 'bookId' no es necesario aquí

    const handleVote = async (reviewId: string, voteType: 'like' | 'dislike') => {
        // Verificar si el usuario quiere votar una review propia
        const review = reviews.find(r => r.id === reviewId);
        if (review?.isAuthor) {
            console.log("No se puede votar la propia reseña:", reviewId);
            setVoteError({ message: "No puedes votar tu propia reseña.", reviewId });
            setTimeout(() => {
                setVoteError(null);
            }, 4000);
            return;
        }

        // Prevenir votos múltiples al mismo review
        if (votingInProgress.has(reviewId)) {
            console.log("Vote in progress for review:", reviewId);
            return;
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
            });

            if (!response.ok) {
                const errorData = await response.json();
                
                // Manejar error específico de autor votando su propia review
                if (errorData.error === 'You cannot vote your own review' || 
                    errorData.message?.includes('cannot vote your own review') ||
                    response.status === 403) {
                    
                    // Revertir la actualización optimista
                    setReviews(prevReviews =>
                        prevReviews.map(rev => {
                            if (rev.id === reviewId) {
                                const originalReview = reviews.find(r => r.id === reviewId);
                                return originalReview ? {
                                    ...rev,
                                    likesCount: originalReview.likesCount,
                                    dislikesCount: originalReview.dislikesCount,
                                    userVote: originalReview.userVote,
                                    isAuthor: true
                                } : rev;
                            }
                            return rev;
                        })
                    );
                    
                    setVoteError({ message: "No puedes votar tu propia reseña.", reviewId });
                    return;
                }
                
                // Para otros errores, recargar reviews
                await loadReviews();
                setVoteError(errorData.message || 'Error al votar');
                throw new Error(errorData.message || 'Error al votar');
            }

            const data = await response.json();
            // console.log("Vote API Response:", data);

            // Sincronizar con la respuesta del servidor
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

            // Limpiar cualquier error de voto previo
            setVoteError(null);

        } catch (error) {
            console.error('Error al votar:', error);
            // Revertir la actualización optimista en caso de error
            // (esto se podría hacer mejor guardando el estado anterior)
            setVoteError({ 
                message: error instanceof Error ? error.message : 'Error al vojtar', 
                reviewId 
            });
        } finally {
            // Quitar el reviewId del set de votos en progreso
            setVotingInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(reviewId);
                return newSet;
            });
        }
    }

    return {
        votingInProgress,
        voteError,
        handleVote,
        setVoteError
    };
}