import { Review } from '@/lib/types';
import StarRating from './StarRating';

interface ReviewStatsProps {
    reviews: Review[];
}

export default function ReviewStats({ reviews }: ReviewStatsProps) {
    const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

    const totalReviews = reviews.length;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-gray-800">
                        {averageRating.toFixed(1)}
                    </div>
                    <div>
                        <StarRating rating={Math.round(averageRating)} readOnly size="sm" />
                        <p className="text-xs text-gray-500 mt-1">
                            {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'}
                        </p>
                    </div>
                </div>
                
                {/* Distribución de estrellas (opcional) */}
                <div className="hidden md:block text-sm text-gray-600">
                    <div className="space-y-1">
                        {[5, 4, 3, 2, 1].map(stars => {
                            const count = reviews.filter(r => r.rating === stars).length;
                            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                            
                            return (
                                <div key={stars} className="flex items-center gap-2 text-xs">
                                    <span className="w-2">{stars}</span>
                                    <span>★</span>
                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-yellow-400 transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="w-6 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}