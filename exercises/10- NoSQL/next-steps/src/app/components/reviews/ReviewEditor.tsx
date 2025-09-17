import { Review } from '@/lib/types';
import StarRating from './StarRating';

interface ReviewEditorProps {
    review: Review;
    editReview: Partial<Review>;
    onEditReviewChange: (editReview: Partial<Review>) => void;
    onSave: () => void;
    onCancel: () => void;
    isSaving?: boolean;
}

export default function ReviewEditor({ 
    review, 
    editReview, 
    onEditReviewChange, 
    onSave, 
    onCancel,
    isSaving = false 
}: ReviewEditorProps) {
    const handleRatingChange = (rating: number) => {
        onEditReviewChange({ ...editReview, rating });
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onEditReviewChange({ ...editReview, comment: e.target.value });
    };

    const isValid = editReview.rating && editReview.comment?.trim();

    return (
        <div className="mb-3">
            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calificación
                </label>
                <StarRating 
                    rating={editReview.rating || 0}
                    onRatingChange={handleRatingChange}
                    size="lg"
                />
            </div>
            
            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comentario
                </label>
                <textarea
                    value={editReview.comment || ''}
                    onChange={handleCommentChange}
                    placeholder="Escribe tu reseña aquí..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                />
            </div>
            
            <div className="flex gap-2">
                <button
                    onClick={onSave}
                    disabled={!isValid || isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition-colors"
                >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                    onClick={onCancel}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}