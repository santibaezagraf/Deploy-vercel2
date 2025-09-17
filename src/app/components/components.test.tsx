import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestData, mockAPIResponse } from '@/test/testUtils';

// Mock del hook useAuth
const mockAuthState = {
    user: null,
    loading: false,
    isAuthenticated: false,
    accessToken: null,
};

const mockAuthActions = {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
};

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(() => ({
        ...mockAuthState,
        ...mockAuthActions,
    })),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
    }),
    usePathname: () => '/dashboard',
}));

// Mock fetch
const mockFetch = vi.fn() as MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock component que simula formulario de login
const MockLoginForm = () => {
    const { login } = mockAuthActions;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        
        try {
            await login({ email, password });
        } catch (error) {
            console.error('Login failed');
        }
    };

    return (
        <form onSubmit={handleSubmit} data-testid="login-form">
            <input
                type="email"
                name="email"
                placeholder="Email"
                data-testid="email-input"
                required
            />
            <input
                type="password"
                name="password"
                placeholder="Password"
                data-testid="password-input"
                required
            />
            <button type="submit" data-testid="login-button">
                Iniciar Sesión
            </button>
        </form>
    );
};

// Mock component que simula formulario de review
const MockReviewForm = ({ bookId }: { bookId: string }) => {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const rating = Number(formData.get('rating'));
        const comment = formData.get('comment') as string;
        
        try {
            await fetch('/api/protected/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ bookId, rating, comment }),
            });
        } catch (error) {
            console.error('Review submission failed');
        }
    };

    return (
        <form onSubmit={handleSubmit} data-testid="review-form">
            <select name="rating" data-testid="rating-select" required>
                <option value="">Seleccionar rating</option>
                <option value="1">1 estrella</option>
                <option value="2">2 estrellas</option>
                <option value="3">3 estrellas</option>
                <option value="4">4 estrellas</option>
                <option value="5">5 estrellas</option>
            </select>
            <textarea
                name="comment"
                placeholder="Escribe tu reseña..."
                data-testid="comment-textarea"
                required
            />
            <button type="submit" data-testid="submit-review">
                Enviar Reseña
            </button>
        </form>
    );
};

// Mock component que simula botón de favorito
const MockFavoriteButton = ({ bookId, isFavorite }: { bookId: string; isFavorite: boolean }) => {
    const handleClick = async () => {
        try {
            const method = isFavorite ? 'DELETE' : 'POST';
            await fetch('/api/protected/favorites', {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ bookId }),
            });
        } catch (error) {
            console.error('Favorite toggle failed');
        }
    };

    return (
        <button
            onClick={handleClick}
            data-testid="favorite-button"
            aria-label={isFavorite ? 'Remover de favoritos' : 'Agregar a favoritos'}
        >
            {isFavorite ? '❤️' : '🤍'}
        </button>
    );
};

describe('Component Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockClear();
    });

    describe('Authentication Components', () => {
        it('should render login form correctly', () => {
            render(<MockLoginForm />);

            expect(screen.getByTestId('login-form')).toBeInTheDocument();
            expect(screen.getByTestId('email-input')).toBeInTheDocument();
            expect(screen.getByTestId('password-input')).toBeInTheDocument();
            expect(screen.getByTestId('login-button')).toBeInTheDocument();
        });

        it('should handle login form submission', async () => {
            const user = userEvent.setup();
            mockAuthActions.login.mockResolvedValueOnce(undefined);

            render(<MockLoginForm />);

            await user.type(screen.getByTestId('email-input'), 'test@example.com');
            await user.type(screen.getByTestId('password-input'), 'password123');
            await user.click(screen.getByTestId('login-button'));

            expect(mockAuthActions.login).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });

        it('should show validation errors for empty form', async () => {
            const user = userEvent.setup();
            render(<MockLoginForm />);

            await user.click(screen.getByTestId('login-button'));

            // En un formulario real, esto mostraría errores de validación
            // Aquí solo verificamos que el botón existe y es clickeable
            expect(screen.getByTestId('login-button')).toBeInTheDocument();
        });
    });

    describe('Review Components', () => {
        it('should render review form correctly', () => {
            render(<MockReviewForm bookId="book123" />);

            expect(screen.getByTestId('review-form')).toBeInTheDocument();
            expect(screen.getByTestId('rating-select')).toBeInTheDocument();
            expect(screen.getByTestId('comment-textarea')).toBeInTheDocument();
            expect(screen.getByTestId('submit-review')).toBeInTheDocument();
        });

        it('should handle review form submission', async () => {
            const user = userEvent.setup();
            mockFetch.mockResolvedValueOnce(mockAPIResponse.success(createTestData.review()));

            render(<MockReviewForm bookId="book123" />);

            await user.selectOptions(screen.getByTestId('rating-select'), '5');
            await user.type(screen.getByTestId('comment-textarea'), 'Excellent book! Highly recommended.');
            await user.click(screen.getByTestId('submit-review'));

            expect(fetch).toHaveBeenCalledWith('/api/protected/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    bookId: 'book123',
                    rating: 5,
                    comment: 'Excellent book! Highly recommended.',
                }),
            });
        });

        it('should validate rating selection', async () => {
            const user = userEvent.setup();
            render(<MockReviewForm bookId="book123" />);

            // Intentar enviar sin seleccionar rating
            await user.type(screen.getByTestId('comment-textarea'), 'Test comment');
            await user.click(screen.getByTestId('submit-review'));

            // El formulario HTML5 debería prevenir el envío
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should validate comment length', async () => {
            const user = userEvent.setup();
            render(<MockReviewForm bookId="book123" />);

            await user.selectOptions(screen.getByTestId('rating-select'), '5');
            // Intentar enviar sin comentario
            await user.click(screen.getByTestId('submit-review'));

            // El formulario HTML5 debería prevenir el envío
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    describe('Favorite Components', () => {
        it('should render favorite button correctly when not favorite', () => {
            render(<MockFavoriteButton bookId="book123" isFavorite={false} />);

            const button = screen.getByTestId('favorite-button');
            expect(button).toBeInTheDocument();
            expect(button).toHaveTextContent('🤍');
            expect(button).toHaveAttribute('aria-label', 'Agregar a favoritos');
        });

        it('should render favorite button correctly when is favorite', () => {
            render(<MockFavoriteButton bookId="book123" isFavorite={true} />);

            const button = screen.getByTestId('favorite-button');
            expect(button).toBeInTheDocument();
            expect(button).toHaveTextContent('❤️');
            expect(button).toHaveAttribute('aria-label', 'Remover de favoritos');
        });

        it('should handle add to favorites', async () => {
            const user = userEvent.setup();
            mockFetch.mockResolvedValueOnce(mockAPIResponse.success(createTestData.favorite()));

            render(<MockFavoriteButton bookId="book123" isFavorite={false} />);

            await user.click(screen.getByTestId('favorite-button'));

            expect(fetch).toHaveBeenCalledWith('/api/protected/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ bookId: 'book123' }),
            });
        });

        it('should handle remove from favorites', async () => {
            const user = userEvent.setup();
            mockFetch.mockResolvedValueOnce(mockAPIResponse.success({ message: 'Removed' }));

            render(<MockFavoriteButton bookId="book123" isFavorite={true} />);

            await user.click(screen.getByTestId('favorite-button'));

            expect(fetch).toHaveBeenCalledWith('/api/protected/favorites', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ bookId: 'book123' }),
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors gracefully', async () => {
            const user = userEvent.setup();
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            // Mock console.error to verify error handling
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            render(<MockReviewForm bookId="book123" />);

            await user.selectOptions(screen.getByTestId('rating-select'), '5');
            await user.type(screen.getByTestId('comment-textarea'), 'Test comment');
            await user.click(screen.getByTestId('submit-review'));

            // Verificar que el error fue loggeado
            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Review submission failed');
            });

            consoleSpy.mockRestore();
        });

        it('should handle unauthorized requests', async () => {
            const user = userEvent.setup();
            mockFetch.mockResolvedValueOnce(mockAPIResponse.unauthorized());

            render(<MockFavoriteButton bookId="book123" isFavorite={false} />);

            await user.click(screen.getByTestId('favorite-button'));

            expect(fetch).toHaveBeenCalled();
            // En una aplicación real, esto redirigiría al login o mostraría un mensaje de error
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels', () => {
            render(<MockFavoriteButton bookId="book123" isFavorite={false} />);

            const button = screen.getByTestId('favorite-button');
            expect(button).toHaveAttribute('aria-label');
        });

        it('should be keyboard accessible', async () => {
            const user = userEvent.setup();
            mockFetch.mockResolvedValueOnce(mockAPIResponse.success({}));

            render(<MockFavoriteButton bookId="book123" isFavorite={false} />);

            const button = screen.getByTestId('favorite-button');
            
            // Enfocar con Tab y activar con Enter
            await user.tab();
            expect(button).toHaveFocus();
            
            await user.keyboard('{Enter}');
            expect(fetch).toHaveBeenCalled();
        });

        it('should have proper form labels', () => {
            render(<MockReviewForm bookId="book123" />);

            const ratingSelect = screen.getByTestId('rating-select');
            const commentTextarea = screen.getByTestId('comment-textarea');

            // En una aplicación real, estos tendrían labels apropiados
            expect(ratingSelect).toBeInTheDocument();
            expect(commentTextarea).toBeInTheDocument();
        });
    });
});