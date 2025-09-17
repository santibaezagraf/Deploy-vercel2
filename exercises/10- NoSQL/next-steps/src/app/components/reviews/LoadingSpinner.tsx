interface LoadingSpinnerProps {
    message?: string;
}

export default function LoadingSpinner({ message = "Cargando..." }: LoadingSpinnerProps) {
    return (
        <div className="space-y-4">
            <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">{message}</p>
            </div>
        </div>
    );
}