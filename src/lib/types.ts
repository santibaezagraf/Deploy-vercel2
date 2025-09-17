export interface Review {
  id: string;
  bookId: string;
  userId: string;
  username: string;
  rating: number; // 1-5 stars
  comment: string;
  likesCount: number;
  dislikesCount: number;
  createdAt: Date;
  updatedAt: Date;

  // Campos adicionales para facilitar el manejo en el frontend
  userVote?: 'like' | 'dislike' | null; // El voto del usuario actual (si existe)
  isAuthor?: boolean; // Si el usuario actual es el autor del review
}

export interface Book {
  id: string;
  title: string;
  authors: string[];
  publishedDate: string;
  publisher: string;
  description: string;
  pageCount: number;
  categories: string[];
  averageRating: number;
  ratingsCount: number;
  thumbnail: string;
  infoLink: string;
}

export interface Vote {
  id: string;
  userId: string;
  reviewId: string;
  like: boolean;
}