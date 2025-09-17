interface VotingButtonsProps {
    reviewId: string;
    likesCount: number;
    dislikesCount: number;
    userVote: 'like' | 'dislike' | null;
    onVote: (reviewId: string, voteType: 'like' | 'dislike') => void;
    isVoting: boolean;
    voteError?: { message: string, reviewId: string } | null;
}

export default function VotingButtons({ 
    reviewId, 
    likesCount, 
    dislikesCount, 
    userVote, 
    onVote, 
    isVoting,
    voteError 
}: VotingButtonsProps) {
    return (
        <div className="flex items-center gap-4 text-sm">
            <button
                onClick={() => onVote(reviewId, 'like')}
                disabled={isVoting}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-150 focus:outline-none active:scale-95 ${
                    userVote === 'like'
                        ? 'border-green-500 bg-green-100 text-green-700 shadow-sm'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-green-400 hover:text-green-600 hover:bg-green-50 focus:ring-2 focus:ring-green-300'
                }`}
            >
                <svg 
                    className="w-4 h-4" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                >
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span className="font-medium">{likesCount}</span>
            </button>
            
            <button
                onClick={() => onVote(reviewId, 'dislike')}
                disabled={isVoting}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-150 focus:outline-none active:scale-95 ${
                    userVote === 'dislike'
                        ? 'border-red-500 bg-red-100 text-red-700 shadow-sm'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-300'
                }`}
            >
                <svg 
                    className="w-4 h-4 transform rotate-180" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                >
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span className="font-medium">{dislikesCount}</span>
            </button>
            
            {voteError && voteError.reviewId === reviewId && (
                <span className="text-red-600 ml-2">{voteError.message}</span>
            )}
        </div>
    );
}