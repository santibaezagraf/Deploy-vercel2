'use client'
import { useState, useTransition } from 'react';
import { useAuth } from '@/hooks/useAuth';
import StarRating from './StarRating';

interface ReviewFormProps {
    bookId: string;
    onReviewCreated: () => void;
}

const cleanReview = {
    rating: 5,
    comment: '',
};

export default function ReviewForm({ bookId, onReviewCreated }: ReviewFormProps) {
    const [newReview, setNewReview] = useState(cleanReview);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [creationError, setCreationError] = useState<string | null>(null);
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newReview.comment.trim()) {
            setCreationError('El comentario es obligatorio');
            return;
        }

        startTransition(async () => {
            try {
                setCreationError(null);

                const reviewData = {
                    bookId,
                    username: user?.username,
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
                    setCreationError(errorData.error || 'Error al crear reseña');
                    throw new Error(errorData.error || 'Error al crear reseña');
                }

                // Resetear formulario y cerrar
                setNewReview(cleanReview);
                setShowReviewForm(false);
                onReviewCreated();

            } catch (error) {
                console.error('Error al crear reseña:', error);
                setCreationError(error instanceof Error ? error.message : 'Error al crear reseña');
            }
        });
    };

    if (!user) {
        return (
            <div className="text-center py-4 text-gray-600">
                <p>Inicia sesión para escribir una reseña</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            {!showReviewForm ? (
                <button
                    onClick={() => setShowReviewForm(true)}
                    className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium"
                >
                    + Escribir una reseña
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="font-semibold text-gray-800 text-lg">Escribir reseña</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Calificación
                        </label>
                        <StarRating 
                            rating={newReview.rating}
                            onRatingChange={(rating) => setNewReview({ ...newReview, rating })}
                            size="lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comentario
                        </label>
                        <textarea
                            value={newReview.comment}
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
                            disabled={isPending || !newReview.comment.trim()}
                            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            {isPending ? 'Publicando...' : 'Publicar reseña'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowReviewForm(false);
                                setNewReview(cleanReview);
                                setCreationError(null);
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
            )}
        </div>
    );
}