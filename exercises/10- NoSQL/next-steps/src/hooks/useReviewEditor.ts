'use client'
import { useState } from 'react';
import { Review } from '@/lib/types';

const cleanReview: Partial<Review> = {
    rating: 5,
    comment: '',
};

export function useReviewEditor() {
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editReview, setEditReview] = useState<Partial<Review>>(cleanReview);

    const startEditing = (review: Review) => {
        setEditingReviewId(review.id);
        setEditReview({
            rating: review.rating,
            comment: review.comment
        });
    };

    const cancelEditing = () => {
        setEditingReviewId(null);
        setEditReview(cleanReview);
    };

    const isEditing = (reviewId: string) => {
        return editingReviewId === reviewId;
    };

    return {
        editingReviewId,
        editReview,
        setEditReview,
        startEditing,
        cancelEditing,
        isEditing
    };
}