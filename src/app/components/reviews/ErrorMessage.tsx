interface ErrorMessageProps {
    error: string;
    onRetry?: () => void;
}

export default function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
    return (
        <div className="space-y-4">
            <div className="text-center py-4 text-red-600">
                <p>{error}</p>
                {onRetry && (
                    <button 
                        onClick={onRetry}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                        Reintentar
                    </button>
                )}
            </div>
        </div>
    );
}