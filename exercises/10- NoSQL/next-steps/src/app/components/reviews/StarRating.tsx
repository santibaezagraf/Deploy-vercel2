interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readOnly?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({ 
    rating, 
    onRatingChange, 
    readOnly = false, 
    size = 'md' 
}: StarRatingProps) {
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl'
    };

    const stars = [1, 2, 3, 4, 5];

    if (readOnly) {
        return (
            <div className="flex">
                {stars.map((star) => (
                    <span
                        key={star}
                        className={`${sizeClasses[size]} ${
                            star <= rating 
                                ? 'text-yellow-500' 
                                : 'text-gray-300'
                        }`}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    }

    return (
        <div className="flex gap-1">
            {stars.map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onRatingChange?.(star)}
                    className={`${sizeClasses[size]} transition-colors ${
                        star <= rating 
                            ? 'text-yellow-500 hover:text-yellow-600' 
                            : 'text-gray-300 hover:text-yellow-400'
                    }`}
                >
                    ★
                </button>
            ))}
        </div>
    );
}