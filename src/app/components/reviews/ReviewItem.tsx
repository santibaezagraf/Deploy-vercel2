import { Review } from '@/lib/types';
import StarRating from './StarRating';
import VotingButtons from './VotingButtons';
import ReviewEditor from './ReviewEditor';

interface ReviewItemProps {
    review: Review;
    isAuthor: boolean;
    isEditing: boolean;
    editReview: Partial<Review>;
    onEditReviewChange: (editReview: Partial<Review>) => void;
    onStartEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onDelete: () => void;
    onVote: (reviewId: string, voteType: 'like' | 'dislike') => void;
    isVoting: boolean;
    voteError?: { message: string, reviewId: string } | null;
}

export default function ReviewItem({
    review,
    isAuthor,
    isEditing,
    editReview,
    onEditReviewChange,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onVote,
    isVoting,
    voteError
}: ReviewItemProps) {
    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleDelete = () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
            onDelete();
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {review.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800 text-sm">{review.username}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} readOnly size="sm" />
                        <span className="text-xs text-gray-500">
                            {formatDate(review.createdAt)}
                        </span>
                    </div>
                </div>
                
                {/* Botones de editar/eliminar para reviews propias */}
                {isAuthor && (
                    <div className="flex gap-2">
                        <button
                            onClick={onStartEdit}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar reseña"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleDelete}
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
            {isEditing ? (
                <ReviewEditor
                    review={review}
                    editReview={editReview}
                    onEditReviewChange={onEditReviewChange}
                    onSave={onSaveEdit}
                    onCancel={onCancelEdit}
                />
            ) : (
                <>
                    <p className="text-gray-700 text-sm mb-3">{review.comment}</p>
                    
                    {/* Botones de votación - solo se muestran cuando no se está editando */}
                    <VotingButtons
                        reviewId={review.id}
                        likesCount={review.likesCount}
                        dislikesCount={review.dislikesCount}
                        userVote={review.userVote || null}
                        onVote={onVote}
                        isVoting={isVoting}
                        voteError={voteError}
                    />
                </>
            )}
        </div>
    );
}