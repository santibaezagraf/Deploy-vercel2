'use client'
import { useReviews } from '../../../hooks/useReviews';
import { useVoting } from '../../../hooks/useVoting';
import { useReviewEditor } from '../../../hooks/useReviewEditor';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import ReviewStats from './ReviewStats';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';

interface BookReviewsProps {
    bookId: string;
}

export default function BookReviews({ bookId }: BookReviewsProps) {
    const { 
        reviews, 
        loading, 
        error, 
        loadReviews, 
        updateReview, 
        deleteReview, 
        setReviews,
        isAuthor 
    } = useReviews(bookId);

    const { 
        votingInProgress, 
        voteError, 
        handleVote 
    } = useVoting({ reviews, setReviews });

    const { 
        editingReviewId, 
        editReview, 
        setEditReview, 
        startEditing, 
        cancelEditing, 
        isEditing 
    } = useReviewEditor();

    const handleSaveEdit = async (reviewId: string) => {
        if (!editReview.rating || !editReview.comment?.trim()) {
            return;
        }

        try {
            await updateReview(reviewId, editReview.rating, editReview.comment);
            cancelEditing();
        } catch (error) {
            console.error('Error al guardar edición:', error);
            // El error ya se maneja en el hook useReviews
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        try {
            await deleteReview(reviewId);
        } catch (error) {
            console.error('Error al eliminar reseña:', error);
            // El error ya se maneja en el hook useReviews
        }
    };

    if (loading) {
        return <LoadingSpinner message="Cargando reseñas..." />;
    }

    if (error) {
        return <ErrorMessage error={error} onRetry={loadReviews} />;
    }

    return (
        <div className="space-y-4">
            <ReviewStats reviews={reviews} />
            <ReviewForm bookId={bookId} onReviewCreated={loadReviews} />
            <ReviewList
                reviews={reviews}
                isAuthor={isAuthor}
                editingReviewId={editingReviewId}
                editReview={editReview}
                onEditReviewChange={setEditReview}
                onStartEdit={startEditing}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={cancelEditing}
                onDeleteReview={handleDeleteReview}
                onVote={handleVote}
                votingInProgress={votingInProgress}
                voteError={voteError}
            />
        </div>
    );
}