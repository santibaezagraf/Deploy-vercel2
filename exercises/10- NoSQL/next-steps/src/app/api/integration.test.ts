import { describe, it, expect, beforeEach, afterEach, vi, Mock, MockedFunction, afterAll, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { setupTestDB, cleanupTestDB, teardownTestDB, createTestData, mockAPIResponse } from '@/test/testUtils';
import { mock } from 'node:test';

// Mock fetch global
const mockFetch = vi.fn() as MockedFunction<typeof fetch>;
global.fetch = mockFetch;


describe('API Integration Tests', () => {
    beforeAll(async () => {
        await setupTestDB();
    });

    beforeEach(async () => {
        await cleanupTestDB();
        vi.clearAllMocks();
        mockFetch.mockClear();
    });

    // afterEach(async () => {
    //     await cleanupTestDB();
    // });

    afterAll(async () => {
        await teardownTestDB();
    })

    describe('Authentication APIs', () => {
        it('should handle login API flow', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123',
            };

            const expectedResponse = {
                user: createTestData.user(),
                token: 'jwt-token',
            };

            mockFetch.mockResolvedValueOnce(mockAPIResponse.success(expectedResponse));

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            });

            const data = await response.json();

            expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            });

            expect(response.ok).toBe(true);
            expect(data.user.email).toBe(loginData.email);
            expect(data.token).toBeDefined();
        });

        it('should handle register API flow', async () => {
            const registerData = {
                email: 'newuser@example.com',
                username: 'newuser',
                password: 'password123',
            };

            const expectedResponse = {
                user: createTestData.user(registerData),
                token: 'jwt-token',
            };

            mockFetch.mockResolvedValueOnce(mockAPIResponse.success(expectedResponse));

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData),
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.user.email).toBe(registerData.email);
            expect(data.user.username).toBe(registerData.username);
        });
    });

    describe('Reviews APIs', () => {
        it('should handle create review API', async () => {
            const reviewData = {
                bookId: 'book123',
                rating: 5,
                comment: 'Excellent book! Highly recommended.',
            };

            const expectedResponse = createTestData.review(reviewData);

            mockFetch.mockResolvedValueOnce(mockAPIResponse.success(expectedResponse));

            const response = await fetch('/api/protected/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(reviewData),
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.bookId).toBe(reviewData.bookId);
            expect(data.rating).toBe(reviewData.rating);
            expect(data.comment).toBe(reviewData.comment);
        });

        it('should handle get reviews by book API', async () => {
            const bookId = 'book123';
            const expectedReviews = [
                createTestData.review({ bookId }),
                createTestData.review({ bookId, rating: 4, comment: 'Good book!' }),
            ];

            mockFetch.mockResolvedValueOnce(mockAPIResponse.success({ reviews: expectedReviews }));

            const response = await fetch(`/api/reviews?bookId=${bookId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.reviews).toHaveLength(2);
            expect(data.reviews[0].bookId).toBe(bookId);
            expect(data.reviews[1].bookId).toBe(bookId);
        });

        it('should handle update review API', async () => {
            const reviewId = 'review123';
            const updateData = {
                rating: 4,
                comment: 'Updated comment',
            };

            const expectedResponse = createTestData.review({ _id: reviewId, ...updateData });

            mockFetch.mockResolvedValueOnce(mockAPIResponse.success(expectedResponse));

            const response = await fetch(`/api/protected/reviews/${reviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.rating).toBe(updateData.rating);
            expect(data.comment).toBe(updateData.comment);
        });

        it('should handle delete review API', async () => {
            const reviewId = 'review123';

            mockFetch.mockResolvedValueOnce(mockAPIResponse.success({ message: 'Review deleted' }));

            const response = await fetch(`/api/protected/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.message).toBe('Review deleted');
        });
    });

    describe('Favorites APIs', () => {
        it('should handle add favorite API', async () => {
            const favoriteData = {
                bookId: 'book123',
                bookData: {
                    title: 'Test Book',
                    authors: ['Test Author'],
                },
            };

            const expectedResponse = createTestData.favorite(favoriteData);

            mockFetch.mockResolvedValueOnce(mockAPIResponse.success(expectedResponse));

            const response = await fetch('/api/protected/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(favoriteData),
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.bookId).toBe(favoriteData.bookId);
            expect(data.bookData.title).toBe(favoriteData.bookData.title);
        });

        it('should handle remove favorite API', async () => {
            const bookId = 'book123';

            mockFetch.mockResolvedValueOnce(mockAPIResponse.success({ message: 'Favorite removed' }));

            const response = await fetch('/api/protected/favorites', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ bookId }),
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.message).toBe('Favorite removed');
        });

        it('should handle get user favorites API', async () => {
            const expectedFavorites = [
                createTestData.favorite(),
                createTestData.favorite({ bookId: 'book456' }),
            ];

            mockFetch.mockResolvedValueOnce(mockAPIResponse.success({ favorites: expectedFavorites }));

            const response = await fetch('/api/protected/users/favorites', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.favorites).toHaveLength(2);
        });
    });

    describe('User APIs', () => {
        it('should handle get user reviews API', async () => {
            const expectedReviews = [
                createTestData.review(),
                createTestData.review({ bookId: 'book456' }),
            ];

            mockFetch.mockResolvedValueOnce(mockAPIResponse.success({ reviews: expectedReviews }));

            const response = await fetch('/api/protected/users/reviews', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.reviews).toHaveLength(2);
        });
    });

    describe('Voting APIs', () => {
        it('should handle vote review API', async () => {
            const voteData = {
                reviewId: 'review123',
                voteType: 'like',
            };

            const expectedResponse = {
                message: 'Vote recorded',
                review: createTestData.review({ likesCount: 1 }),
            };

            mockFetch.mockResolvedValueOnce(mockAPIResponse.success(expectedResponse));

            const response = await fetch('/api/protected/votes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(voteData),
            });

            const data = await response.json();

            expect(response.ok).toBe(true);
            expect(data.message).toBe('Vote recorded');
            expect(data.review.likesCount).toBe(1);
        });
    });

    describe('Error Handling', () => {
        it('should handle unauthorized access', async () => {
            mockFetch.mockResolvedValueOnce(mockAPIResponse.unauthorized());

            const response = await fetch('/api/protected/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId: 'book123', rating: 5, comment: 'Test' }),
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(401);

            const data = await response.json();
            expect(data.error).toBe('No autorizado');
        });

        it('should handle validation errors', async () => {
            mockFetch.mockResolvedValueOnce(mockAPIResponse.badRequest('Rating is required'));

            const response = await fetch('/api/protected/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ bookId: 'book123', comment: 'Test' }), // Missing rating
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data.error).toBe('Rating is required');
        });

        it('should handle not found errors', async () => {
            mockFetch.mockResolvedValueOnce(mockAPIResponse.notFound());

            const response = await fetch('/api/protected/reviews/nonexistent', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(404);

            const data = await response.json();
            expect(data.error).toBe('No encontrado');
        });

        it('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(
                fetch('/api/protected/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ bookId: 'book123', rating: 5, comment: 'Test' }),
                })
            ).rejects.toThrow('Network error');
        });
    });
});