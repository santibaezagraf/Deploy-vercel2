'use server'


import type { Review, Book } from "@/lib/types";

interface itemData {
    id: string;
    volumeInfo: {
        title: string;
        authors: string[];
        publishedDate: string;
        publisher: string;
        description: string;
        pageCount: number;
        categories: string[];
        averageRating: number;
        ratingsCount: number;
        imageLinks?: {
            thumbnail: string;
        };
        infoLink: string;
    };
}

// Helper que mapea respuesta de la API a tipo Book
function mapApiResponseToBook(item: itemData): Book {
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
