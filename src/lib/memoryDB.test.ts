import { describe, it, expect, beforeEach } from "vitest";
import { getReviewById, addReview, getReviewsByBookId, voteReviewById } from "@/lib/memoryDB"; 
import type { Review } from "./types";
import { reviews } from "@/lib/memoryDB";

// Simulamos un array global de reseñas.
// En tu módulo real ya existe `reviews`, pero para testear lo ideal es que sea reiniciable.


// Sobrescribimos el array global usado en las funciones:
beforeEach(() => {
    reviews.length = 0; // limpiar el array antes de cada test
});

describe("DB logic", () => {
    it("addReview agrega una reseña con id generado", () => {
        const review: Review = {
        id: "dummy", // se sobrescribe con randomUUID
        bookId: "book123",
        userName: "Santi",
        rating: 5,
        comment: "Excelente",
        date: new Date(),
        likes: 0,
        dislikes: 0,
        };

        addReview(review);

        expect(reviews.length).toBe(1);
        expect(reviews[0].id).not.toBe("dummy"); // se reemplaza por randomUUID
        expect(reviews[0].bookId).toBe("book123");
    });

    it("getReviewById devuelve la reseña correcta", () => {
        const review: Review = {
        id: "r1",
        bookId: "book123",
        userName: "Santi",
        rating: 4,
        comment: "Bueno",
        date: new Date(),
        likes: 0,
        dislikes: 0,
        };
        reviews.push(review);

        const result = getReviewById("r1");
        expect(result).toEqual(review);
    });

    it("getReviewById devuelve undefined si no existe", () => {
        const result = getReviewById("inexistente");
        expect(result).toBeUndefined();
    });

    it("getReviewsByBookId filtra por bookId", () => {
        reviews.push(
        { id: "r1", bookId: "book123", userName: "A", rating: 5, comment: "ok", date: new Date(), likes: 0, dislikes: 0 }
        );

        const result = getReviewsByBookId("book123");
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("r1");
    });

    it("voteReviewById incrementa likes si upvote = true", () => {
        const review = { id: "r1", bookId: "book123", userName: "A", rating: 4, comment: "ok", date: new Date(), likes: 0, dislikes: 0 };
        reviews.push(review);

        voteReviewById("r1", true);
        expect(reviews[0].likes).toBe(1);
        expect(reviews[0].dislikes).toBe(0);
    });

    it("voteReviewById incrementa dislikes si upvote = false", () => {
        const review = { id: "r1", bookId: "book123", userName: "A", rating: 4, comment: "ok", date: new Date(), likes: 0, dislikes: 0 };
        reviews.push(review);

        voteReviewById("r1", false);
        expect(reviews[0].likes).toBe(0);
        expect(reviews[0].dislikes).toBe(1);
    });

    it("voteReviewById no rompe si no existe la reseña", () => {
        expect(() => voteReviewById("inexistente", true)).not.toThrow();
    });
});