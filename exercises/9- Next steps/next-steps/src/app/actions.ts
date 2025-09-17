'use server'

import { getReviewsByBookId, addReview, voteReviewById } from "@/lib/memoryDB";
import type { Review, Book } from "@/lib/types";

// Helper que mapea respuesta de la API a tipo Book
function mapApiResponseToBook(item: any): Book {
    return {
        id: item.id,
        title: item.volumeInfo.title || 'Unknown Title',
        authors: item.volumeInfo.authors || ['Unknown Author'],
        publishedDate: item.volumeInfo.publishedDate || '',
        publisher: item.volumeInfo.publisher || 'Unknown Publisher',
        description: item.volumeInfo.description || '',
        pageCount: item.volumeInfo.pageCount || 0,
        categories: item.volumeInfo.categories || [],
        averageRating: item.volumeInfo.averageRating || 0,
        ratingsCount: item.volumeInfo.ratingsCount || 0,
        thumbnail: item.volumeInfo.imageLinks?.thumbnail || '', // volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
        infoLink: item.volumeInfo.infoLink || '',
    };
}

// Export for testing purposes only
export { mapApiResponseToBook };

export async function searchBooks(formData: FormData, startIndex: number = 0): Promise<{
    books: {
        items?: Book[];
        totalItems?: number;
    } | null;
}> {
    const query = formData.get('query') as string;
    const searchType = formData.get('searchType') as string;

    if (!query) {
        return {
            books: null
        }
    }

    try {
        let searchQuery = '';

        switch (searchType) {
            case 'title':
                searchQuery = encodeURIComponent(query);
                break;
            case 'author':
                searchQuery = `inauthor:${encodeURIComponent(query)}`;
                break;
            case 'isbn':
                searchQuery = `isbn:${encodeURIComponent(query)}`;
                break;
            default:
                searchQuery = encodeURIComponent(query);
        }

        console.log(`Searching books with query: ${searchQuery}`);
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&startIndex=${startIndex}&maxResults=10`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }
        
        const data = await response.json();
        // console.log('raw API response:', data);

        const books = data.items?.map(await mapApiResponseToBook) || [];
        const totalItems = data.totalItems || 0;

        console.log(`Found ${totalItems} books for query: ${searchQuery}`);
        console.log(books);

        return {
            books: {
                items: books,
                totalItems: totalItems
            }
        };
    } catch (error) {
        console.error('Error searching books:', error);
        return {
            books: null
        }
    }
}

export async function getBookReviews(bookId: string) {
    const reviews = getReviewsByBookId(bookId);
    return reviews;
}

export async function addBookReview(bookId: string, review: Review) {
    addReview({ ...review, bookId });
}

export async function voteReview(reviewId: string, upvote: boolean) {
    voteReviewById(reviewId, upvote);
}