export interface Review {
  id: string;
  bookId: string;
  userName: string;
  rating: number; // 1-5 stars
  comment: string;
  date: Date;
  likes: number;
  dislikes: number;
  userVotes?: { [userId: string]: 'like' | 'dislike' };
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
