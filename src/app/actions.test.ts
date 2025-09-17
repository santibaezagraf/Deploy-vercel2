import { describe, it, expect, vi, beforeEach } from "vitest";
import { addBookReview, getBookReviews, mapApiResponseToBook, searchBooks, voteReview } from "./actions";
import * as db from "@/lib/memoryDB";

describe("mapApiResponseToBook", () => {
    it("should map API response to Book", () => {
        const apiResponse = {
            id: "1",
            volumeInfo: {
                title: "Book Title",
                authors: ["Author 1", "Author 2"],
                publishedDate: "2023-01-01",
                publisher: "Publisher",
                description: "Book description",
                pageCount: 100,
                categories: ["Fiction"],
                averageRating: 4.5,
                ratingsCount: 10,
                imageLinks: {
                    thumbnail: "http://example.com/thumbnail.jpg"
                },
                infoLink: "http://example.com/info"
            }
        };

        const book = mapApiResponseToBook(apiResponse);

        expect(book).toEqual({
            id: "1",
            title: "Book Title",
            authors: ["Author 1", "Author 2"],
            publishedDate: "2023-01-01",
            publisher: "Publisher",
            description: "Book description",
            pageCount: 100,
            categories: ["Fiction"],
            averageRating: 4.5,
            ratingsCount: 10,
            thumbnail: "http://example.com/thumbnail.jpg",
            infoLink: "http://example.com/info"
        });
    });

    it("usa valores por defecto si faltan campos", () => {
        const apiItem = { id: "123", volumeInfo: {} };
        const book = mapApiResponseToBook(apiItem);

        expect(book.title).toBe("Unknown Title");
        expect(book.authors).toEqual(["Unknown Author"]);
        expect(book.pageCount).toBe(0);
    });
});

describe("searchBooks", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    it("devuelve null si no hay query", async () => {
        const formData = new FormData();
        const result = await searchBooks(formData);
        expect(result.books).toBeNull();
    });

    it("arma query con author", async () => {
        const formData = new FormData();
        formData.set("query", "Rowling");
        formData.set("searchType", "author");

        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], totalItems: 0 })
        });

        const result = await searchBooks(formData);
        expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("inauthor:Rowling")
        );
        expect(result.books?.items).toEqual([]);
    });

    it("arma query con titulo", async () => {
        const formData = new FormData();
        formData.set("query", "Messi");
        formData.set("searchType", "title");

        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], totalItems: 0 })
        });

        const result = await searchBooks(formData);
        expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("Messi")
        );
        expect(result.books?.items).toEqual([]);
    });

    it("arma query con ISBN", async () => {
        const formData = new FormData();
        formData.set("query", "978-3-16-148410-0");
        formData.set("searchType", "isbn");

        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], totalItems: 0 })
        });

        const result = await searchBooks(formData);
        expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("isbn:978-3-16-148410-0")
        );
        expect(result.books?.items).toEqual([]);
    });
});

describe("addBookReview", () => {
    it("se crea la review exitosamente", () => {
        const review = {
            id: '1',
            bookId: "book123",
            userName: "Santi",
            rating: 5,
            comment: "Excelente libro",
            date: new Date(),
            likes: 0,
            dislikes: 0
        }
        const mock = vi.spyOn(db, "addReview").mockImplementation(() => {});
        addBookReview("book123", review);
        expect(mock).toHaveBeenCalledWith(expect.objectContaining(review));
    });
});

describe("getBookReviews", () => {
    // const review = {
    //     id: '1',
    //     bookId: "book123",
    //     userName: "Santi",
    //     rating: 5,
    //     comment: "Excelente libro",
    //     date: new Date(),
    //     likes: 0,
    //     dislikes: 0
    // }

    
    // it("devuelve las reseñas del libro", async () => {
    //     vi.spyOn(db, "getReviewsByBookId").mockReturnValue([review]);

    //     const result = await getBookReviews("book123");
    //     expect(result).toEqual([review]);
    // });

    // it("devuelve array vacío si no hay reseñas", async () => {
    //     vi.spyOn(db, "getReviewsByBookId").mockReturnValue([]);

    //     const result = await getBookReviews("book123");
    //     expect(result).toEqual([]);
    // });

    it("pasa el bookId correcto a la DB", async () => {
        const spy = vi.spyOn(db, "getReviewsByBookId").mockImplementation(() => []);

        await getBookReviews("book123");
        expect(spy).toHaveBeenCalledWith("book123");
    });
})

describe('voteReview', () => {
    it("vota una reseña", async () => {
        const mock = vi.spyOn(db, "voteReviewById").mockImplementation(() => {});

        await voteReview("review123", true);
        expect(mock).toHaveBeenCalledWith("review123", true);

        await voteReview("review124", false);
        expect(mock).toHaveBeenCalledWith("review124", false);
    });

})