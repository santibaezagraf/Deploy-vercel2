'use client'
import { useState, useEffect, useTransition } from 'react';
import { getBookReviews, addBookReview, voteReview } from '@/app/actions';
import { Review } from '@/lib/types';
import { randomUUID } from 'crypto';

interface BookReviewsProps {
    bookId: string;
}

const cleanReview: Review = {
    id: '',
    bookId: '',
    userName: '',
    rating: 5,
    comment: '',
    date: new Date(),
    likes: 0,
    dislikes: 0,
    userVotes: {}
};

export default function BookReviews({ bookId }: BookReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [newReview, setNewReview] = useState<Review>(cleanReview);
    const [isPending, startTransition] = useTransition();
    const [showReviewForm, setShowReviewForm] = useState(false);

    // Cargar reviews al montar el componente
    useEffect(() => {
        loadReviews();
    }, [bookId]);

    const loadReviews = async () => {
        try {
            const result = await getBookReviews(bookId);
            setReviews(result || []);
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    };

    const handleSubmitReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReview.userName.trim() || !newReview.comment.trim()) {
            alert('Please fill in all fields');
            return;
        }

        startTransition(async() => {
            try {
                const review: Review = {
                    id: '',
                    bookId,
                    userName: newReview.userName,
                    rating: newReview.rating,
                    comment: newReview.comment,
                    date: new Date(),
                    likes: 0,
                    dislikes: 0,
                    userVotes: {}
                };

                await addBookReview(bookId, review);
                await loadReviews(); // Recargar reviews
                
                // Limpiar formulario
                setNewReview(cleanReview);
                setShowReviewForm(false);
                } catch (error) {
                console.error('Error adding review:', error);
                alert('Error adding review');
                }
        });
    };

    const handleVote = (reviewId: string, upvote: boolean) => {
        startTransition(async () => {
        try {
            await voteReview(reviewId, upvote);
            await loadReviews(); // Recargar reviews después de votar
        } catch (error) {
            console.error('Error voting:', error);
        }
    });
    };

    const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
        return (
        <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                type={interactive ? "button" : undefined}
                onClick={interactive ? () => onChange?.(star) : undefined}
                className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            >
                <span className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
                ★
                </span>
            </button>
            ))}
        </div>
        );
    };

    return (
        <div className='container mx-auto p-4'>
            <div className="flex items-center gap-2 mb-6">
                <h3 className="text-xl font-bold text-gray-800">Reviews</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {reviews.length}
                </span>
                
                <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className={`text-sm bg-blue-600 text-white px-3 py-1 rounded hover: transition-colors ${showReviewForm ? 'bg-red-400 hover:bg-red-500' : 'hover:bg-blue-700'}`}
                    >
                    {showReviewForm ? 'Cancel' : 'Add Review'}
                </button>
            </div>

            {/* Formulario para nueva review */}
            {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                    </label>
                    <input
                    type="text"
                    value={newReview.userName}
                    onChange={(e) => setNewReview(prev => ({ ...prev, userName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter your name"
                    required
                    />
                </div>

                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating
                    </label>
                    {renderStars(newReview.rating, true, (rating) => 
                    setNewReview(prev => ({ ...prev, rating }))
                    )}
                </div>

                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Review
                    </label>
                    <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                    placeholder={`Write your review here...`}
                    required
                    />
                </div>

                <div className="flex gap-2">
                    <button
                    type="submit"
                    disabled={isPending}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                    {isPending ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="bg-red-400 text-white px-4 py-2 rounded text-sm hover:bg-red-500 transition-colors"
                    >
                    Cancel
                    </button>
                </div>
                </form>
            )}
            
            {reviews.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-7-4c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No reviews yet</p>
                    <p className="text-gray-400 text-sm">Be the first to share your thoughts!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all duration-200 hover:border-blue-300">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold text-sm">
                                            {review.userName?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{review.userName}</h4>
                                        <div className="flex items-center gap-2">
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                        {review.date.toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="ml-13">
                                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                                
                                {/* Likes/Dislikes section */}
                                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                                    <button 
                                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 transition-colors" 
                                        onClick={() => handleVote(review.id, true)}
                                        disabled={isPending}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                        </svg>
                                        <span className="font-medium">{review.likes || 0}</span>
                                    </button>
                                    <button 
                                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors" 
                                        onClick={() => handleVote(review.id, false)}
                                        disabled={isPending}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                                        </svg>
                                        <span className="font-medium">{review.dislikes || 0}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}