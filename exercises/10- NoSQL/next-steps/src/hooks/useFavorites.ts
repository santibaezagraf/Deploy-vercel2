'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export interface Favorite {
    _id: string
    bookId: string
    userId: string
    bookData: {
        title: string
        authors?: string[]
        imageLinks?: {
            thumbnail: string
        }
        description?: string
        publishedDate?: string
        averageRating?: number
        ratingsCount?: number
    }
    createdAt: string
}

export function useFavorites() {
    const [favorites, setFavorites] = useState<Favorite[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuth()

    // Cargar favoritos del usuario
    const fetchFavorites = async () => {
        if (!user) return

        setIsLoading(true)
        setError(null)
        
        try {
            const response = await fetch('/api/protected/users/favorites', {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            })

            if (!response.ok) {
                throw new Error('Error al cargar favoritos')
            }

            const data = await response.json()
            setFavorites(data.favorites || [])
        } catch (error) {
            console.error('Error fetching favorites:', error)
            setError('Error al cargar favoritos')
        } finally {
            setIsLoading(false)
        }
    }

    // Verificar si un libro está en favoritos
    const isFavorite = (bookId: string): boolean => {
        return favorites.some(fav => fav.bookId === bookId)
    }

    // Agregar a favoritos
    const addToFavorites = async (bookId: string) => {
        if (!user) return false

        try {
            const response = await fetch('/api/protected/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ bookId })
            })

            if (!response.ok) {
                throw new Error('Error al agregar a favoritos')
            }

            const newFavorite = await response.json()
            
            // Actualizar estado local optimísticamente
            setFavorites(prev => [...prev, newFavorite])
            return true
        } catch (error) {
            console.error('Error adding to favorites:', error)
            setError('Error al agregar a favoritos')
            return false
        }
    }

    const toggleFavorite = async (bookId: string) => {
        if (!user) {
            setError('You must be logged in to manage favorites');
            return false;
        }

        try {
            const isFavorite = favorites.some(fav => fav.bookId === bookId);

            // Optimistic UI update
            setFavorites(prev => 
                isFavorite 
                    ? prev.filter(fav => fav.bookId !== bookId) 
                    : [...prev, { bookId } as Favorite] // Placeholder for new favorite
            );

            const response = await fetch('/api/protected/favorites', {
                method: isFavorite ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ bookId })
            });

            if (!response.ok) {
                // Revertir el cambio optimista en caso de error
                setFavorites(prev => 
                    isFavorite 
                        ? [...prev, { bookId } as Favorite] 
                        : prev.filter(fav => fav.bookId !== bookId)
                );

                const errorData = await response.json();
                throw new Error(errorData.message || 'Error updating favorite');
            }

            setError(null);
            return true;

        } catch (error) {
            console.error("Error toggling favorite:", error);
            setError(error instanceof Error ? error.message : 'Error updating favorite');
            return false;
        }
    }

    // Remover de favoritos
    const removeFromFavorites = async (bookId: string) => {
        if (!user) return false

        try {
            const response = await fetch('/api/protected/favorites', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ bookId })
            })

            if (!response.ok) {
                throw new Error('Error al remover de favoritos')
            }

            // Actualizar estado local optimísticamente
            setFavorites(prev => prev.filter(fav => fav.bookId !== bookId))
            return true
        } catch (error) {
            console.error('Error removing from favorites:', error)
            setError('Error al remover de favoritos')
            return false
        }
    }

    // Toggle favorito
    // const toggleFavorite = async (bookId: string, bookData?: any) => {
    //     if (isFavorite(bookId)) {
    //         return await removeFromFavorites(bookId)
    //     } else {
    //         return await addToFavorites(bookId)
    //     }
    // }

    // Cargar favoritos cuando el usuario cambie
    useEffect(() => {
        if (user) {
            fetchFavorites()
        } else {
            setFavorites([])
        }
    }, [user])

    return {
        favorites,
        isLoading,
        error,
        isFavorite,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        fetchFavorites
    }
}