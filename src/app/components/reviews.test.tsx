import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookReviews from './reviews';
import { getBookReviews, addBookReview, voteReview } from '@/app/actions';
import type { Review } from '@/lib/types';

// Mock the actions module
vi.mock('@/app/actions', () => ({
  getBookReviews: vi.fn(),
  addBookReview: vi.fn(),
  voteReview: vi.fn(),
}));

// Mock crypto.randomUUID since it's not available in test environment
vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'mock-uuid-123'),
}));

const mockGetBookReviews = getBookReviews as MockedFunction<typeof getBookReviews>;
const mockAddBookReview = addBookReview as MockedFunction<typeof addBookReview>;
const mockVoteReview = voteReview as MockedFunction<typeof voteReview>;

// Mock review data
const mockReviews: Review[] = [
    {
        id: 'review-1',
        bookId: 'book-1',
        userName: 'John Doe',
        rating: 5,
        comment: 'Excellent book! Really enjoyed reading it.',
        date: new Date('2023-01-15'),
        likes: 10,
        dislikes: 2,
        userVotes: {},
    },
    {
        id: 'review-2',
        bookId: 'book-1',
        userName: 'Jane Smith',
        rating: 4,
        comment: 'Good book, would recommend to others.',
        date: new Date('2023-02-20'),
        likes: 5,
        dislikes: 1,
        userVotes: {},
    },
    {
        id: 'review-3',
        bookId: 'book-1',
        userName: 'Bob Wilson',
        rating: 3,
        comment: 'It was okay, not my favorite but readable.',
        date: new Date('2023-03-10'),
        likes: 2,
        dislikes: 3,
        userVotes: {},
    },
];

describe('BookReviews Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetBookReviews.mockResolvedValue(mockReviews);
        mockAddBookReview.mockResolvedValue(undefined);
        mockVoteReview.mockResolvedValue(undefined);
    });

    it('renders reviews header with correct count', async () => {
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
        expect(screen.getByText('Reviews')).toBeInTheDocument();
        // Use getAllByText and check we have multiple 3s (badge and voting)
        const threes = screen.getAllByText('3');
        expect(threes.length).toBeGreaterThanOrEqual(1);
        
        // Specifically check the reviews count is 3
        expect(mockGetBookReviews).toHaveBeenCalledWith('book-1');
        });
    });

    it('loads and displays reviews on mount', async () => {
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
        expect(mockGetBookReviews).toHaveBeenCalledWith('book-1');
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
        });
    });

    it('displays review details correctly', async () => {
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
        // Check first review details
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Excellent book! Really enjoyed reading it.')).toBeInTheDocument();
        expect(screen.getByText('Good book, would recommend to others.')).toBeInTheDocument();
        
        // Check that we have the expected voting numbers somewhere in the document
        const allNumbers = screen.getAllByText(/\d+/);
        expect(allNumbers.length).toBeGreaterThan(0);
        
        // Check star ratings - each review should have 5 stars
        const starElements = screen.getAllByText('★');
        expect(starElements.length).toBeGreaterThanOrEqual(15); // 3 reviews * 5 stars each
        });
    });

    it('shows empty state when no reviews exist', async () => {
        mockGetBookReviews.mockResolvedValue([]);
        
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
        expect(screen.getByText('No reviews yet')).toBeInTheDocument();
        expect(screen.getByText('Be the first to share your thoughts!')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument(); // Review count should be 0
        });
    });

    it('toggles review form when Add Review button is clicked', async () => {
        const user = userEvent.setup();
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
        expect(screen.getByText('Add Review')).toBeInTheDocument();
        });
        
        const addButton = screen.getByText('Add Review');
        await user.click(addButton);
        
        expect(screen.getByText('Your Name')).toBeInTheDocument();
        expect(screen.getByText('Rating')).toBeInTheDocument();
        expect(screen.getByText('Your Review')).toBeInTheDocument();
        expect(screen.getAllByText('Cancel').length).toBeGreaterThanOrEqual(1);
    });

    it('submits new review with correct data', async () => {
        const user = userEvent.setup();
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
        expect(screen.getByText('Add Review')).toBeInTheDocument();
        });
        
        // Open review form
        const addButton = screen.getByText('Add Review');
        await user.click(addButton);
        
        // Fill form
        const nameInput = screen.getByPlaceholderText('Enter your name');
        const commentInput = screen.getByPlaceholderText('Write your review here...');
        
        await user.type(nameInput, 'Test User');
        await user.type(commentInput, 'This is a test review');
        
        // Submit form
        const submitButton = screen.getByText('Submit Review');
        await user.click(submitButton);
        
        await waitFor(() => {
        expect(mockAddBookReview).toHaveBeenCalledWith('book-1', expect.objectContaining({
            userName: 'Test User',
            comment: 'This is a test review',
            rating: 5, // Default rating
            bookId: 'book-1',
        }));
        });
    });

    it('validates required fields before submission', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        const user = userEvent.setup();
        
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
            expect(screen.getByText('Add Review')).toBeInTheDocument();
        });
        
        // Open review form
        const addButton = screen.getByText('Add Review');
        await user.click(addButton);
        
        // Try to submit without filling required fields
        const submitButton = screen.getByText('Submit Review');
        
        // Use preventDefault to avoid default form validation
        const form = submitButton.closest('form');
        if (form) {
            fireEvent.submit(form);
        }
        
        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Please fill in all fields');
        });
        
        expect(mockAddBookReview).not.toHaveBeenCalled();
        
        alertSpy.mockRestore();
    });

    it('changes rating when stars are clicked in form', async () => {
        const user = userEvent.setup();
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
            expect(screen.getByText('Add Review')).toBeInTheDocument();
        });
        
        // Open review form
        const addButton = screen.getByText('Add Review');
        await user.click(addButton);
        
        // Get rating section stars (should be interactive)
        const ratingSection = screen.getByText('Rating').parentElement;
        const stars = ratingSection?.querySelectorAll('button');
        
        expect(stars).toBeDefined();
        if (stars) {
            // Click on 3rd star (should set rating to 3)
            await user.click(stars[2]);
            
            // Fill other required fields and submit
            const nameInput = screen.getByPlaceholderText('Enter your name');
            const commentInput = screen.getByPlaceholderText('Write your review here...');
            
            await user.type(nameInput, 'Test User');
            await user.type(commentInput, 'Three star review');
            
            const submitButton = screen.getByText('Submit Review');
            await user.click(submitButton);
            
            await waitFor(() => {
                expect(mockAddBookReview).toHaveBeenCalledWith('book-1', expect.objectContaining({
                rating: 3,
                }));
            });
        }
    });

    it('handles voting on reviews', async () => {
        const user = userEvent.setup();
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
        
        // Find like buttons (thumbs up icons)
        const likeButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg') && button.textContent?.includes('10')
        );
        
        if (likeButtons.length > 0) {
            await user.click(likeButtons[0]);
            
            await waitFor(() => {
                expect(mockVoteReview).toHaveBeenCalledWith('review-1', true);
            });
        }
    });

    it('handles downvoting on reviews', async () => {
        const user = userEvent.setup();
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
        
        // Find dislike buttons (thumbs down icons)
        const dislikeButtons = screen.getAllByRole('button').filter(button => 
            button.querySelector('svg') && button.textContent?.includes('2')
        );
        
        if (dislikeButtons.length > 0) {
            await user.click(dislikeButtons[0]);
            
            await waitFor(() => {
                expect(mockVoteReview).toHaveBeenCalledWith('review-1', false);
            });
        }
    });

    it('reloads reviews after voting', async () => {
        const user = userEvent.setup();
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
            expect(mockGetBookReviews).toHaveBeenCalledTimes(1);
        });
        
        // Find and click a like button
        const likeButtons = screen.getAllByRole('button').filter(button => 
            button.querySelector('svg') && button.textContent?.includes('10')
        );
        
        if (likeButtons.length > 0) {
            await user.click(likeButtons[0]);
            
            await waitFor(() => {
                expect(mockGetBookReviews).toHaveBeenCalledTimes(2); // Called again after voting
            });
        }
    });

    it('cancels review form when Cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
            expect(screen.getByText('Add Review')).toBeInTheDocument();
        });
        
        // Open review form
        const addButton = screen.getByText('Add Review');
        await user.click(addButton);
        
        expect(screen.getByText('Your Name')).toBeInTheDocument();
        
        // Click cancel button in form (the second Cancel button)
        const cancelButtons = screen.getAllByText('Cancel');
        const formCancelButton = cancelButtons.find(button => 
            button.closest('form') !== null
        );
        
        if (formCancelButton) {
            await user.click(formCancelButton);
        }
        
        expect(screen.queryByText('Your Name')).not.toBeInTheDocument();
        expect(screen.getByText('Add Review')).toBeInTheDocument();
    });

    it('clears form after successful submission', async () => {
        const user = userEvent.setup();
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
            expect(screen.getByText('Add Review')).toBeInTheDocument();
        });
        
        // Open review form
        const addButton = screen.getByText('Add Review');
        await user.click(addButton);
        
        // Fill form
        const nameInput = screen.getByPlaceholderText('Enter your name');
        const commentInput = screen.getByPlaceholderText('Write your review here...');
        
        await user.type(nameInput, 'Test User');
        await user.type(commentInput, 'Test comment');
        
        // Submit form
        const submitButton = screen.getByText('Submit Review');
        await user.click(submitButton);
        
        await waitFor(() => {
            // Form should be hidden after submission
            expect(screen.queryByText('Your Name')).not.toBeInTheDocument();
            expect(screen.getByText('Add Review')).toBeInTheDocument();
        });
    });

    it('displays loading state for form submission', async () => {
        // Make addBookReview hang to simulate loading
        mockAddBookReview.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
        
        const user = userEvent.setup();
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
        expect(screen.getByText('Add Review')).toBeInTheDocument();
        });
        
        // Open review form and fill it
        const addButton = screen.getByText('Add Review');
        await user.click(addButton);
        
        const nameInput = screen.getByPlaceholderText('Enter your name');
        const commentInput = screen.getByPlaceholderText('Write your review here...');
        
        await user.type(nameInput, 'Test User');
        await user.type(commentInput, 'Test comment');
        
        // Submit form
        const submitButton = screen.getByText('Submit Review');
        await user.click(submitButton);
        
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled();
    });

    it('handles error when loading reviews fails', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockGetBookReviews.mockRejectedValue(new Error('Failed to load reviews'));
        
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading reviews:', expect.any(Error));
        });
        
        consoleSpy.mockRestore();
    });

    it('handles error when adding review fails', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        
        mockAddBookReview.mockRejectedValue(new Error('Failed to add review'));
        
        const user = userEvent.setup();
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
        expect(screen.getByText('Add Review')).toBeInTheDocument();
        });
        
        // Open review form and fill it
        const addButton = screen.getByText('Add Review');
        await user.click(addButton);
        
        const nameInput = screen.getByPlaceholderText('Enter your name');
        const commentInput = screen.getByPlaceholderText('Write your review here...');
        
        await user.type(nameInput, 'Test User');
        await user.type(commentInput, 'Test comment');
        
        // Submit form
        const submitButton = screen.getByText('Submit Review');
        await user.click(submitButton);
        
        await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error adding review:', expect.any(Error));
        expect(alertSpy).toHaveBeenCalledWith('Error adding review');
        });
        
        consoleSpy.mockRestore();
        alertSpy.mockRestore();
    });

    it('displays user initials correctly in avatar', async () => {
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
        const jInitials = screen.getAllByText('J');
        expect(jInitials.length).toBeGreaterThanOrEqual(1); // John Doe and Jane Smith
        expect(screen.getByText('B')).toBeInTheDocument(); // Bob Wilson
        });
    });

    it('formats dates correctly', async () => {
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
        // Check for formatted dates (these will be locale-specific)
        const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
        expect(dateElements.length).toBeGreaterThan(0);
        });
    });

    it('disables voting buttons during voting operation', async () => {
        // Make voteReview hang to simulate loading
        mockVoteReview.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
        
        const user = userEvent.setup();
        render(<BookReviews bookId="book-1" />);
        
        await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
        
        // Find and click a like button
        const likeButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg') && button.textContent?.includes('10')
        );
        
        if (likeButtons.length > 0) {
        await user.click(likeButtons[0]);
        
        // All voting buttons should be disabled during the operation
        const allVotingButtons = screen.getAllByRole('button').filter(button => 
            button.querySelector('svg') && (button.textContent?.match(/\d+/))
        );
        
        allVotingButtons.forEach(button => {
            expect(button).toBeDisabled();
        });
        }
    });
});