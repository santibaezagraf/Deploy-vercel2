import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import Review from "@/models/Review";

// GET - Obtener todas las reseñas del usuario autenticado
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const userInfo = getUserFromRequest(request);
        if (!userInfo) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sortBy = searchParams.get('sortBy') || 'recent';

        // Configurar el orden según el parámetro
        let sortOptions = {};
        switch (sortBy) {
            case 'recent':
                sortOptions = { createdAt: -1 };
                break;
            case 'oldest':
                sortOptions = { createdAt: 1 };
                break;
            case 'rating':
                sortOptions = { rating: -1, createdAt: -1 };
                break;
            default:
                sortOptions = { createdAt: -1 };
        }

        // Obtener las reseñas del usuario
        const reviews = await Review.find({ userId: userInfo.userId })
            .sort(sortOptions)
            .select('bookId rating comment likesCount dislikesCount createdAt updatedAt')
            .lean();

        // Aquí podrías enriquecer con información del libro desde Google Books API

        const enrichedReviews = await Promise.all(
            reviews.map(async (review) => {
                try {
                    // Obtener información del libro desde Google Books API
                    const bookResponse = await fetch(
                        `https://www.googleapis.com/books/v1/volumes/${review.bookId}`
                    );

                    if (bookResponse.ok) {
                        const bookData = await bookResponse.json();
                        const volumeInfo = bookData.volumeInfo || {};

                        return {
                            ...review,
                            bookInfo: {
                                title: volumeInfo.title || 'Título desconocido',
                                authors: volumeInfo.authors || ['Autor desconocido'],
                                thumbnail: volumeInfo.imageLinks?.thumbnail,
                            }
                        };
                    } else {
                        return {
                            ...review,
                            bookInfo: {
                                title: 'Título desconocido',
                                authors: ['Autor desconocido'],
                                thumbnail: null,
                            }
                        };
                    }
                } catch (error) {
                    console.error('Error fetching book data:', error);
                    return {
                        ...review,
                        bookInfo: {
                            title: 'Título desconocido',
                            authors: ['Autor desconocido'],
                            thumbnail: null,
                        }
                    };
                }
            })
        );

        return NextResponse.json({
            reviews: enrichedReviews,
            count: reviews.length,
            sortBy
        });

    } catch (error) {
        console.error('Error fetching user reviews:', error);
        return NextResponse.json({ 
            error: 'Error fetching user reviews' 
        }, { status: 500 });
    }
}