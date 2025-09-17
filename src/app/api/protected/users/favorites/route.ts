import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import Favorite from "@/models/Favorite";

// GET - Obtener todos los favoritos del usuario autenticado
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
            case 'title':
                // Para ordenar por título necesitaremos la info del libro
                sortOptions = { createdAt: -1 }; // Por ahora por fecha
                break;
            default:
                sortOptions = { createdAt: -1 };
        }

        // Obtener los favoritos del usuario
        const favorites = await Favorite.find({ userId: userInfo.userId })
            .sort(sortOptions)
            .select('bookId notes createdAt')
            .lean();

        // Enriquecer con información del libro desde Google Books API
        const enrichedFavorites = await Promise.all(
            favorites.map(async (favorite) => {
                try {
                    // Obtener información del libro desde Google Books API
                    const bookResponse = await fetch(
                        `https://www.googleapis.com/books/v1/volumes/${favorite.bookId}`
                    );
                    
                    if (bookResponse.ok) {
                        const bookData = await bookResponse.json();
                        const volumeInfo = bookData.volumeInfo || {};
                        
                        return {
                            ...favorite,
                            bookInfo: {
                                title: volumeInfo.title || 'Título desconocido',
                                authors: volumeInfo.authors || ['Autor desconocido'],
                                thumbnail: volumeInfo.imageLinks?.thumbnail,
                                description: volumeInfo.description,
                                publishedDate: volumeInfo.publishedDate,
                                pageCount: volumeInfo.pageCount,
                                categories: volumeInfo.categories
                            }
                        };
                    } else {
                        // Si no se puede obtener la info del libro
                        return {
                            ...favorite,
                            bookInfo: {
                                title: `Libro ${favorite.bookId}`,
                                authors: ['Autor desconocido']
                            }
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching book info for ${favorite.bookId}:`, error);
                    return {
                        ...favorite,
                        bookInfo: {
                            title: `Libro ${favorite.bookId}`,
                            authors: ['Autor desconocido']
                        }
                    };
                }
            })
        );

        // Si el sorting es por título, ordenar aquí
        if (sortBy === 'title') {
            enrichedFavorites.sort((a, b) => 
                (a.bookInfo?.title || '').localeCompare(b.bookInfo?.title || '')
            );
        }

        return NextResponse.json({
            favorites: enrichedFavorites,
            count: favorites.length,
            sortBy
        });

    } catch (error) {
        console.error('Error fetching user favorites:', error);
        return NextResponse.json({ 
            error: 'Error fetching user favorites' 
        }, { status: 500 });
    }
}