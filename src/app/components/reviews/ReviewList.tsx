import { Review } from '@/lib/types';
import ReviewItem from './ReviewItem';

interface ReviewListProps {
    reviews: Review[];
    isAuthor: (review: Review) => boolean;
    editingReviewId: string | null;
    editReview: Partial<Review>;
    onEditReviewChange: (editReview: Partial<Review>) => void;
    onStartEdit: (review: Review) => void;
    onSaveEdit: (reviewId: string) => void;
    onCancelEdit: () => void;
    onDeleteReview: (reviewId: string) => void;
    onVote: (reviewId: string, voteType: 'like' | 'dislike') => void;
    votingInProgress: Set<string>;
    voteError?: { message: string, reviewId: string } | null;
}

export default function ReviewList({
    reviews,
    isAuthor,
    editingReviewId,
    editReview,
    onEditReviewChange,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDeleteReview,
    onVote,
    votingInProgress,
    voteError
}: ReviewListProps) {
    if (reviews.length === 0) {
        return (
            <div className="text-gray-500 text-sm text-center py-8">
                <div className="mb-2">📚</div>
                <p>Aún no hay reseñas para este libro.</p>
                <p>¡Sé el primero en escribir una!</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-80 overflow-y-auto">
            {reviews.map((review) => (
                <ReviewItem
                    key={review.id}
                    review={review}
                    isAuthor={isAuthor(review)}
                    isEditing={editingReviewId === review.id}
                    editReview={editReview}
                    onEditReviewChange={onEditReviewChange}
                    onStartEdit={() => onStartEdit(review)}
                    onSaveEdit={() => onSaveEdit(review.id)}
                    onCancelEdit={onCancelEdit}
                    onDelete={() => onDeleteReview(review.id)}
                    onVote={onVote}
                    isVoting={votingInProgress.has(review.id)}
                    voteError={voteError}
                />
            ))}
        </div>
    );
}