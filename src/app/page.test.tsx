import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './page';
import { searchBooks } from './actions';
import type { Book } from '@/lib/types';

// Mock the actions module
vi.mock('./actions', () => ({
    searchBooks: vi.fn(),
}));

// Mock the BookReviews component
vi.mock('./components/reviews', () => ({
    default: ({ bookId }: { bookId: string }) => (
        <div data-testid={`book-reviews-${bookId}`}>Book Reviews for {bookId}</div>
    ),
}));

const mockSearchBooks = searchBooks as MockedFunction<typeof searchBooks>;

// Mock book data
const mockBooks: Book[] = [
    {
        id: 'book-1',
        title: 'Test Book 1',
        authors: ['Author 1', 'Author 2'],
        publishedDate: '2023-01-01',
        publisher: 'Test Publisher',
        description: 'This is a test book description that is longer than 150 characters to test the read more functionality. It should be truncated initially and then expanded when the user clicks read more.',
        pageCount: 200,
        categories: ['Fiction', 'Adventure'],
        averageRating: 4.5,
        ratingsCount: 100,
        thumbnail: 'https://example.com/thumbnail1.jpg',
        infoLink: 'https://example.com/book1',
    },
    {
        id: 'book-2',
        title: 'Test Book 2',
        authors: ['Author 3'],
        publishedDate: '2023-02-01',
        publisher: 'Another Publisher',
        description: 'Short description',
        pageCount: 150,
        categories: ['Non-Fiction'],
        averageRating: 3.8,
        ratingsCount: 50,
        thumbnail: '',
        infoLink: 'https://example.com/book2',
    },
];

const mockSearchResponse = {
    books: {
        items: mockBooks,
        totalItems: 2,
    },
};

describe('Home Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchBooks.mockResolvedValue(mockSearchResponse);
    });

    it('renders the search form with default state', () => {
        render(<Home />);
        
        expect(screen.getByText('Search for Books')).toBeInTheDocument();
        expect(screen.getByLabelText('Title')).toBeChecked();
        expect(screen.getByLabelText('Author')).not.toBeChecked();
        expect(screen.getByLabelText('ISBN')).not.toBeChecked();
        expect(screen.getByPlaceholderText('Enter book title')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    });

    it('updates search type when radio buttons are clicked', async () => {
        const user = userEvent.setup();
        render(<Home />);
        
        const authorRadio = screen.getByLabelText('Author');
        const isbnRadio = screen.getByLabelText('ISBN');
        
        await user.click(authorRadio);
        expect(authorRadio).toBeChecked();
        expect(screen.getByPlaceholderText('Enter author name')).toBeInTheDocument();
        
        await user.click(isbnRadio);
        expect(isbnRadio).toBeChecked();
        expect(screen.getByPlaceholderText('Enter ISBN (10 or 13 digits)')).toBeInTheDocument();
    });

    it('performs search when form is submitted', async () => {
        const user = userEvent.setup();
        render(<Home />);
        
        const searchInput = screen.getByPlaceholderText('Enter book title');
        const searchButton = screen.getByRole('button', { name: 'Search' });
        
        await user.type(searchInput, 'test query');
        await user.click(searchButton);
        
        await waitFor(() => {
        expect(mockSearchBooks).toHaveBeenCalledWith(
            expect.any(FormData),
            0
        );
        });
    });

    it('displays search results after successful search', async () => {
        const user = userEvent.setup();
        render(<Home />);
        
        const searchInput = screen.getByPlaceholderText('Enter book title');
        const searchButton = screen.getByRole('button', { name: 'Search' });
        
        await user.type(searchInput, 'test query');
        await user.click(searchButton);
        
        await waitFor(() => {
        expect(screen.getByText('Test Book 1')).toBeInTheDocument();
        expect(screen.getByText('Test Book 2')).toBeInTheDocument();
        expect(screen.getByText('Author 1, Author 2')).toBeInTheDocument();
        expect(screen.getByText('Author 3')).toBeInTheDocument();
        });
    });

    it('displays loading state during search', async () => {
        mockSearchBooks.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
        
        const user = userEvent.setup();
        render(<Home />);
        
        const searchInput = screen.getByPlaceholderText('Enter book title');
        const searchButton = screen.getByRole('button', { name: 'Search' });
        
        await user.type(searchInput, 'test query');
        await user.click(searchButton);
        
        // Check that both the button and loading text appear
        expect(screen.getByRole('button', { name: 'Searching...' })).toBeDisabled();
        expect(screen.getAllByText('Searching...')).toHaveLength(2); // Button and loading indicator
        
        // Check loading spinner is present
        expect(screen.getByText('Searching...', { selector: 'p' })).toBeInTheDocument();
    });

    it('displays no results message when search returns empty', async () => {
        mockSearchBooks.mockResolvedValue({ books: { items: [], totalItems: 0 } });
        
        const user = userEvent.setup();
        render(<Home />);
        
        const searchInput = screen.getByPlaceholderText('Enter book title');
        const searchButton = screen.getByRole('button', { name: 'Search' });
        
        await user.type(searchInput, 'nonexistent book');
        await user.click(searchButton);
        
        await waitFor(() => {
        expect(screen.getByText('No books found')).toBeInTheDocument();
        expect(screen.getByText('Try different search terms or check your spelling.')).toBeInTheDocument();
        });
    });

    it('toggles book description expansion', async () => {
        const user = userEvent.setup();
        render(<Home />);
        
        const searchInput = screen.getByPlaceholderText('Enter book title');
        const searchButton = screen.getByRole('button', { name: 'Search' });
        
        await user.type(searchInput, 'test query');
        await user.click(searchButton);
        
        await waitFor(() => {
        expect(screen.getByText('Test Book 1')).toBeInTheDocument();
        });
        
        const readMoreButton = screen.getByRole('button', { name: 'Read more' });
        expect(readMoreButton).toBeInTheDocument();
        
        await user.click(readMoreButton);
        
        expect(screen.getByRole('button', { name: 'Read less' })).toBeInTheDocument();
        expect(screen.getByText(/This is a test book description that is longer than 150 characters to test the read more functionality. It should be truncated initially and then expanded when the user clicks read more./)).toBeInTheDocument();
    });

    it('displays pagination controls when there are results', async () => {
        const user = userEvent.setup();
        render(<Home />);
        
        const searchInput = screen.getByPlaceholderText('Enter book title');
        const searchButton = screen.getByRole('button', { name: 'Search' });
        
        await user.type(searchInput, 'test query');
        await user.click(searchButton);
        
        await waitFor(() => {
        expect(screen.getByRole('button', { name: '← Previous' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next →' })).toBeInTheDocument();
        expect(screen.getByText('Page 1')).toBeInTheDocument();
        });
    });

    it('disables previous button on first page', async () => {
        const user = userEvent.setup();
        render(<Home />);
        
        const searchInput = screen.getByPlaceholderText('Enter book title');
        const searchButton = screen.getByRole('button', { name: 'Search' });
        
        await user.type(searchInput, 'test query');
        await user.click(searchButton);
        
        await waitFor(() => {
        const previousButton = screen.getByRole('button', { name: '← Previous' });
        expect(previousButton).toBeDisabled();
        });
    });

    it('handles pagination next button click', async () => {
        // Mock response with more items to enable next button
        mockSearchBooks.mockResolvedValue({
        books: {
            items: Array(10).fill(null).map((_, i) => ({ ...mockBooks[0], id: `book-${i}` })),
            totalItems: 20,
        },
        });
        
        const user = userEvent.setup();
        render(<Home />);
        
        const searchInput = screen.getByPlaceholderText('Enter book title');
        const searchButton = screen.getByRole('button', { name: 'Search' });
        
        await user.type(searchInput, 'test query');
        await user.click(searchButton);
        
        await waitFor(() => {
        expect(screen.getByText('Page 1')).toBeInTheDocument();
        });
        
        const nextButton = screen.getByRole('button', { name: 'Next →' });
        await user.click(nextButton);
        
        await waitFor(() => {
        expect(mockSearchBooks).toHaveBeenCalledTimes(2);
        expect(mockSearchBooks).toHaveBeenLastCalledWith(
            expect.any(FormData),
            10
        );
        });
    });

    it('displays book information correctly', async () => {
        const user = userEvent.setup();
        render(<Home />);
        
        const searchInput = screen.getByPlaceholderText('Enter book title');
        const searchButton = screen.getByRole('button', { name: 'Search' });
        
        await user.type(searchInput, 'test query');
        await user.click(searchButton);
        
        await waitFor(() => {
        // Check title and authors
        expect(screen.getByText('Test Book 1')).toBeInTheDocument();
        expect(screen.getByText('Author 1, Author 2')).toBeInTheDocument();
        
        // Check publication info
        expect(screen.getByText('Published: 2023-01-01')).toBeInTheDocument();
        expect(screen.getByText('Publisher: Test Publisher')).toBeInTheDocument();
        expect(screen.getByText('Pages: 200')).toBeInTheDocument();
        
        // Check categories
        expect(screen.getByText('Fiction')).toBeInTheDocument();
        expect(screen.getByText('Adventure')).toBeInTheDocument();
        
        // Check thumbnail
        const thumbnail = screen.getByAltText('Test Book 1');
        expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumbnail1.jpg');
        });
    });

    it('displays placeholder image when thumbnail is not available', async () => {
        const user = userEvent.setup();
        render(<Home />);
        
        const searchInput = screen.getByPlaceholderText('Enter book title');
        const searchButton = screen.getByRole('button', { name: 'Search' });
        
        await user.type(searchInput, 'test query');
        await user.click(searchButton);
        
        await waitFor(() => {
        expect(screen.getByText('No image')).toBeInTheDocument();
        });
    });

    it('renders BookReviews component for each book', async () => {
        const user = userEvent.setup();
        render(<Home />);
        
        const searchInput = screen.getByPlaceholderText('Enter book title');
        const searchButton = screen.getByRole('button', { name: 'Search' });
        
        await user.type(searchInput, 'test query');
        await user.click(searchButton);
        
        await waitFor(() => {
        expect(screen.getByTestId('book-reviews-book-1')).toBeInTheDocument();
        expect(screen.getByTestId('book-reviews-book-2')).toBeInTheDocument();
        });
    });

    it('handles search error gracefully', async () => {
        mockSearchBooks.mockRejectedValue(new Error('Search failed'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        const user = userEvent.setup();
        render(<Home />);
        
        const searchInput = screen.getByPlaceholderText('Enter book title');
        const searchButton = screen.getByRole('button', { name: 'Search' });
        
        await user.type(searchInput, 'test query');
        await user.click(searchButton);
        
        await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error searching books:', expect.any(Error));
        });
        
        consoleSpy.mockRestore();
    });

    it('does not show no results message before first search', () => {
        render(<Home />);
        expect(screen.queryByText('No books found')).not.toBeInTheDocument();
    });

    it('resets expanded books when new search is performed', async () => {
        const user = userEvent.setup();
        render(<Home />);
        
        // First search
        const searchInput = screen.getByPlaceholderText('Enter book title');
        const searchButton = screen.getByRole('button', { name: 'Search' });
        
        await user.type(searchInput, 'test query');
        await user.click(searchButton);
        
        await waitFor(() => {
        expect(screen.getByText('Test Book 1')).toBeInTheDocument();
        });
        
        // Expand description
        const readMoreButton = screen.getByRole('button', { name: 'Read more' });
        await user.click(readMoreButton);
        
        expect(screen.getByRole('button', { name: 'Read less' })).toBeInTheDocument();
        
        // Clear input and perform new search
        await user.clear(searchInput);
        await user.type(searchInput, 'new query');
        await user.click(searchButton);
        
        await waitFor(() => {
        // Should be back to "Read more" state
        expect(screen.getByRole('button', { name: 'Read more' })).toBeInTheDocument();
        });
    });
});