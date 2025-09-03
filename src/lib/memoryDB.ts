import { randomUUID } from "crypto";
import { Review } from "./types"

// Simulación de una base de datos en memoria
export const reviews: Review[] = []

export function getReviewById(reviewId: string): Review | undefined {
    return reviews.find(review => review.id === reviewId);
}

export function addReview(review: Review) {
    reviews.push({ ...review, id: randomUUID() });
}

export function getReviewsByBookId(bookId: string): Review[] {
    return reviews.filter(review => review.bookId === bookId);
}

export function voteReviewById(reviewId: string, upvote: boolean) {
    const review = getReviewById(reviewId);
    if (review) {
        if (upvote) {
            review.likes += 1;
        } else {
            review.dislikes += 1;
        }
    }
}
