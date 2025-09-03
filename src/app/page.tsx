'use client'
import { searchBooks } from "./actions"
import { useState, useTransition } from "react";
import type { Book } from "@/lib/types";
import BookReviews from "./components/reviews";


export default function Home() {
  const [books, setBooks] = useState<{items?: Book[], totalItems?: number} | null>(null);
  const [searchType, setSearchType] = useState('title');
  const [expandedBooks, setExpandedBooks] = useState<Set<number>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(0);
  const [lastSearchData, setLastSearchData] = useState<FormData | null>(null);
  const itemsPerPage = 10;

  const toggleDescription = (bookIndex: number) => {
    setExpandedBooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookIndex)) {
        newSet.delete(bookIndex);
      } else {
        newSet.add(bookIndex);
      }
      return newSet;
    });
  };

  const handleSearch = async (formData: FormData, startIndex: number = 0) => {
    setExpandedBooks(new Set());
    setHasSearched(true);
    setLastSearchData(formData);
    setCurrentPage(Math.floor(startIndex / itemsPerPage));

    startTransition(async() => {
      try {
        const result = await searchBooks(formData, startIndex);
        setBooks(result.books || null);
      } catch (error) {
        console.error('Error searching books:', error);
        setBooks(null);
      }
    })
  };

  const handleFormSubmit = async (formData: FormData) => {
    setCurrentPage(0); // Reset page to 0 for new searches
    await handleSearch(formData, 0);
  };

  const handlePageChange = async (direction: 'prev' | 'next') => {
    if (!lastSearchData) return;
    
    const newStartIndex = direction === 'next' 
      ? (currentPage + 1) * itemsPerPage 
      : Math.max(0, (currentPage - 1) * itemsPerPage);
    
    await handleSearch(lastSearchData, newStartIndex);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Search for Books
      </h2>

      <form action={handleFormSubmit} className="mb-8">
     {/* Search Type Selection */}
          <div className="mb-6">
            
            <p className="block text-sm font-medium text-gray-700 mb-3">Search by:</p>
            
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center cursor-pointer bg-gray-50 hover:bg-blue-50 px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200">
                <input
                  type="radio"
                  name="searchType"
                  value="title"
                  defaultChecked={searchType === 'title'}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="mr-3 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-gray-700 font-medium">Title</span>
              </label>
              <label className="flex items-center cursor-pointer bg-gray-50 hover:bg-blue-50 px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200">
                <input
                  type="radio"
                  name="searchType"
                  value="author"
                  defaultChecked={searchType === 'author'}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">Author</span>
              </label>
              <label className="flex items-center cursor-pointer bg-gray-50 hover:bg-blue-50 px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200">
                <input
                  type="radio"
                  name="searchType"
                  value="isbn"
                  defaultChecked={searchType === 'isbn'}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">ISBN</span>
              </label>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-4 items-end justify-center">
            <div className="flex-1 max-w-md">
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                {searchType === 'title' && 'Book Title'}
                {searchType === 'author' && 'Author Name'}
                {searchType === 'isbn' && 'ISBN'}
              </label>
              <input 
                id="query"
                type="text" 
                name="query"
                key={searchType} 
                placeholder={
                  searchType === 'title' ? 'Enter book title' :
                  searchType === 'author' ? 'Enter author name' :
                  'Enter ISBN (10 or 13 digits)'
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
              />
            </div>
            <button 
              type="submit" 
              disabled={isPending}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium whitespace-nowrap"
            > 
              {isPending ? 'Searching...' : 'Search'}
            </button>
          </div>
      </form>

      {/* Botones de paginación */}
      {!isPending && books && (books.totalItems || 0) > 0 && (
        <div className="flex justify-center items-center gap-4 mb-6">
          <button
            onClick={() => handlePageChange('prev')}
            disabled={currentPage === 0 || isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-600 mx-10">
            <span>Page {currentPage + 1}</span>
            {/* <span>•</span> */}
            {/* <span>Showing {currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, books.totalItems || 0)} of {books.totalItems}</span> */}
          </div>
          
          <button
            onClick={() => handlePageChange('next')}
            disabled={!books.items || books.items.length < itemsPerPage || isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            Next →
          </button>
        </div>
      )}

      {/* Mostrar loading */}
      {isPending && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Searching...</p>
        </div>
      )}

      {/* Mostrar resultados si hay libros */}
      {!isPending && books && (books.totalItems || 0) > 0 && (
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">
            Books {currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, books.totalItems || 0)}
          </h3>
          {books.items && (
            <div>
              {/* <h3 className="text-2xl font-semibold text-gray-800 mb-6">Results:</h3> */}
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
              {books.items.map((book: Book, index: number) => (
                <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-200">
                  <div className="flex h-full relative">
                    
                    

                    <div className="flex-1">
                      <div className="flex-col-2">
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                            {book.title}
                          </h4>
                          <p className="text-gray-600 text-sm mb-2">
                            {book.authors?.join(', ') || 'Unknown Author'}
                          </p>
                          
                          {/* Publication Info */}
                          <div className="text-xs text-gray-500 mb-3">
                            {book.publishedDate && (
                            <p>Published: {book.publishedDate}</p>
                            )}
                            {book.publisher && (
                            <p>Publisher: {book.publisher}</p>
                            )}
                            {book.pageCount && (
                            <p>Pages: {book.pageCount}</p>
                            )}
                          </div>

                          {/* Categories */}
                          {book.categories && (
                            <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {book.categories.slice(0, 2).map((category: string, catIndex: number) => (
                              <span key={catIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {category}
                              </span>
                              ))}
                            </div>
                          </div>
                        )}
                        </div>

                        {/* Cover image in upper right corner */}
                        <div className="absolute top-0 right-0">
                          {book.thumbnail ? (
                            <img 
                              src={book.thumbnail} 
                              alt={book.title}
                              className="w-32 h-40 object-cover rounded shadow-sm"
                            />
                          ) : (
                            <div className="w-32 h-40 bg-gray-200 rounded shadow-sm flex items-center justify-center">
                              <div className="text-center text-gray-500">
                                <svg className="w-8 h-8 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs">No image</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {book.description && (
                      <div className="mb-4 mt-4">
                        <p className="text-gray-700 text-sm">
                        {book.description.length > 150 ? (
                          <>
                          {expandedBooks.has(index) ? 
                            book.description : 
                            `${book.description.substring(0, 150)}...`
                          }
                          <button 
                            onClick={() => toggleDescription(index)}
                            className="text-blue-600 hover:text-blue-800 ml-1 text-xs underline"
                          >
                            {expandedBooks.has(index) ? 'Read less' : 'Read more'}
                          </button>
                          </>
                        ) : 
                          book.description}
                        </p>
                      </div>
                      )}
                      
                      <BookReviews bookId={book.id} />
                    </div>
                    
                  </div>
                
                </div>

              ))}
              </div>
            </div>
          )}

          
        </div>
      )}

      {/* Mostrar "no results" solo si ya se buscó y no hay resultados */}
      {!isPending && hasSearched && (!books || !books.items || books.totalItems === 0) && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.137 0-4.146.832-5.657 2.343" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-500">Try different search terms or check your spelling.</p>
          </div>
        </div>
      )}

  
</div>
  )
}
