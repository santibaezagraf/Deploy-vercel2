'use client'

import { useState } from "react";

interface FavoriteButtonProps {
    bookId: string;
    isFavorite: boolean;
    onToggle: (bookId: string) => Promise<boolean>;
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
}

export default function FavoriteButton({ 
    bookId, 
    isFavorite,
    onToggle,
    size = 'md',
    showText = false
}: FavoriteButtonProps) {
    const [isToggling, setIsToggling] = useState<boolean>(false);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isToggling) return;

        setIsToggling(true);
        try {
            await onToggle(bookId);
        } catch (error) {
            console.error("Error toggling favorite:", error);
        } finally {
            setIsToggling(false);
        }
    }

    const sizeClasses = {
        sm: 'w-6 h-6 p-1',
        md: 'w-8 h-8 p-1.5',
        lg: 'w-10 h-10 p-2'
    };

    const iconSizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    return (
        <button
            onClick={handleClick}
            disabled={isToggling}
            className={`
                ${sizeClasses[size]}
                ${isFavorite 
                    ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100' 
                    : 'text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50'
                }
                rounded-full transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed
                border border-gray-200 hover:border-red-300
                focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-opacity-50
                active:scale-95
                ${showText ? 'flex items-center gap-2 px-3 rounded-lg' : ''}
            `}
            title={isFavorite ? 'Remover de favoritos' : 'Agregar a favoritos'}
            aria-label={isFavorite ? 'Remover de favoritos' : 'Agregar a favoritos'}
        >
            {isToggling ? (
                <svg className={`${iconSizeClasses[size]} animate-spin`} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <svg className={iconSizeClasses[size]} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={isFavorite ? 0 : 2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                    />
                </svg>
            )}
            {showText &&  (
                <span className="text-sm font-medium">
                    {isFavorite ? 'Favorito' : 'Agregar'}
                </span>
            )}
        </button>
    );
}
