import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from '@/models/User';
import Review from '@/models/Review';
import Favorite from '@/models/Favorites';

// Mock de la conexión a la base de datos
let mongoServer: MongoMemoryServer;

beforeEach(async () => {
    // Crear instancia de MongoDB en memoria
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Conectar mongoose a la instancia de prueba
    await mongoose.connect(mongoUri);
});

afterEach(async () => {
    // Limpiar y cerrar la conexión después de cada prueba
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe('Database CRUD Operations', () => {
    describe('User Model', () => {
        it('should create a user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'hashedpassword123',
            };

            const user = new User(userData);
            const savedUser = await user.save();

            expect(savedUser._id).toBeDefined();
            expect(savedUser.email).toBe(userData.email);
            expect(savedUser.username).toBe(userData.username);
            expect(savedUser.password).toBeDefined();
            expect(savedUser.password).not.toBe(userData.password); // Password should be hashed
            expect(savedUser.createdAt).toBeInstanceOf(Date);
        });

        it('should not allow duplicate emails', async () => {
            const userData1 = {
                email: 'test@example.com',
                username: 'testuser1',
                password: 'hashedpassword123',
            };

            const userData2 = {
                email: 'test@example.com', // Same email
                username: 'testuser2',
                password: 'hashedpassword456',
            };

            const user1 = new User(userData1);
            await user1.save();

            const user2 = new User(userData2);
            await expect(user2.save()).rejects.toThrow();
        });

        it('should find user by email', async () => {
            const userData = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'hashedpassword123',
            };

            const user = new User(userData);
            await user.save();

            const foundUser = await User.findOne({ email: 'test@example.com' });
            expect(foundUser).toBeTruthy();
            expect(foundUser?.email).toBe(userData.email);
        });

        it('should update user information', async () => {
            const userData = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'hashedpassword123',
            };

            const user = new User(userData);
            const savedUser = await user.save();

            const updatedUser = await User.findByIdAndUpdate(
                savedUser._id,
                { username: 'updateduser' },
                { new: true }
            );

            expect(updatedUser?.username).toBe('updateduser');
        });

        it('should delete user', async () => {
            const userData = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'hashedpassword123',
            };

            const user = new User(userData);
            const savedUser = await user.save();

            await User.findByIdAndDelete(savedUser._id);

            const deletedUser = await User.findById(savedUser._id);
            expect(deletedUser).toBeNull();
        });
    });

    describe('Review Model', () => {
        let userId: string;

        beforeEach(async () => {
            // Crear un usuario para las pruebas de reseñas
            const user = new User({
                email: 'test@example.com',
                username: 'testuser',
                password: 'hashedpassword123',
            });
            const savedUser = await user.save();
            userId = savedUser._id.toString();
        });

        it('should create a review successfully', async () => {
            const reviewData = {
                bookId: 'book123',
                userId: userId,
                username: 'testuser',
                rating: 5,
                comment: 'Excellent book!',
                likesCount: 0,
                dislikesCount: 0,
            };

            const review = new Review(reviewData);
            const savedReview = await review.save();

            expect(savedReview._id).toBeDefined();
            expect(savedReview.bookId).toBe(reviewData.bookId);
            expect(savedReview.userId.toString()).toBe(userId);
            expect(savedReview.rating).toBe(reviewData.rating);
            expect(savedReview.comment).toBe(reviewData.comment);
            expect(savedReview.createdAt).toBeInstanceOf(Date);
        });

        it('should find reviews by bookId', async () => {
            const bookId1 = 'book123';
            const bookId2 = 'book456';
            
            // Crear múltiples reseñas para el mismo libro
            const review1 = new Review({
                bookId: bookId1,
                userId: userId,
                username: 'testuser',
                rating: 5,
                comment: 'Great!',
                likesCount: 0,
                dislikesCount: 0,
            });

            const review2 = new Review({
                bookId: bookId2,
                userId: userId,
                username: 'testuser',
                rating: 4,
                comment: 'Good!',
                likesCount: 0,
                dislikesCount: 0,
            });

            await review1.save();
            await review2.save();

            const savedReview1 = await Review.findOne({ bookId: bookId1 });
            const savedReview2 = await Review.findOne({ bookId: bookId2 });

            expect(savedReview1).toBeTruthy();
            expect(savedReview1?.bookId).toBe(bookId1);
            expect(savedReview2).toBeTruthy();
            expect(savedReview2?.bookId).toBe(bookId2);

            // const reviews = await Review.find({ bookId: { $in: [bookId1, bookId2] } }).sort({ createdAt: -1 });
            // expect(reviews).toHaveLength(2);
            // expect(reviews[0].bookId).toBe(bookId1 || bookId2);
            // expect(reviews[1].bookId).toBe(bookId1 || bookId2);
        });

        it('should update review likes count', async () => {
            const review = new Review({
                bookId: 'book123',
                userId: userId,
                username: 'testuser',
                rating: 5,
                comment: 'Great!',
                likesCount: 0,
                dislikesCount: 0,
            });

            const savedReview = await review.save();

            const updatedReview = await Review.findByIdAndUpdate(
                savedReview._id,
                { $inc: { likesCount: 1 } },
                { new: true }
            );

            expect(updatedReview?.likesCount).toBe(1);
        });

        it('should delete review', async () => {
            const review = new Review({
                bookId: 'book123',
                userId: userId,
                username: 'testuser',
                rating: 5,
                comment: 'Great!',
                likesCount: 0,
                dislikesCount: 0,
            });

            const savedReview = await review.save();

            await Review.findByIdAndDelete(savedReview._id);

            const deletedReview = await Review.findById(savedReview._id);
            expect(deletedReview).toBeNull();
        });
    });

    describe('Favorite Model', () => {
        let userId: string;

        beforeEach(async () => {
            // Crear un usuario para las pruebas de favoritos
            const user = new User({
                email: 'test@example.com',
                username: 'testuser',
                password: 'hashedpassword123',
            });
            const savedUser = await user.save();
            userId = savedUser._id.toString();
        });

        it('should create a favorite successfully', async () => {
            const favoriteData = {
                userId: userId,
                bookId: 'book123',
                bookData: {
                    title: 'Test Book',
                    authors: ['Test Author'],
                    description: 'A test book',
                    publishedDate: '2023',
                },
            };

            const favorite = new Favorite(favoriteData);
            const savedFavorite = await favorite.save();

            expect(savedFavorite._id).toBeDefined();
            expect(savedFavorite.userId.toString()).toBe(userId);
            expect(savedFavorite.bookId).toBe(favoriteData.bookId);
            if (savedFavorite.bookData) {
                expect(savedFavorite.bookData.title).toBe(favoriteData.bookData.title);
            }
            expect(savedFavorite.createdAt).toBeInstanceOf(Date);
        });

        it('should not allow duplicate favorites for same user and book', async () => {
            const favoriteData = {
                userId: userId,
                bookId: 'book123',
                bookData: {
                    title: 'Test Book',
                    authors: ['Test Author'],
                },
            };

            const favorite1 = new Favorite(favoriteData);
            await favorite1.save();

            const favorite2 = new Favorite(favoriteData);
            await expect(favorite2.save()).rejects.toThrow();
        });

        it('should find favorites by userId', async () => {
            const favorite1 = new Favorite({
                userId: userId,
                bookId: 'book123',
                bookData: { title: 'Book 1', authors: ['Author 1'] },
            });

            const favorite2 = new Favorite({
                userId: userId,
                bookId: 'book456',
                bookData: { title: 'Book 2', authors: ['Author 2'] },
            });

            await favorite1.save();
            await favorite2.save();

            const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 });
            expect(favorites).toHaveLength(2);
            expect(favorites[0].userId.toString()).toBe(userId);
            expect(favorites[1].userId.toString()).toBe(userId);
        });

        it('should delete favorite', async () => {
            const favorite = new Favorite({
                userId: userId,
                bookId: 'book123',
                bookData: { title: 'Test Book', authors: ['Test Author'] },
            });

            const savedFavorite = await favorite.save();

            await Favorite.findOneAndDelete({ userId, bookId: 'book123' });

            const deletedFavorite = await Favorite.findById(savedFavorite._id);
            expect(deletedFavorite).toBeNull();
        });
    });
});