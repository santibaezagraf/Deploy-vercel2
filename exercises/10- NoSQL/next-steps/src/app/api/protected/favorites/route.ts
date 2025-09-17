import { getUserFromRequest } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Favorite from "@/models/Favorite";
import { NextRequest, NextResponse } from "next/server";


// GET - Obtener favoritos del usuario
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const userInfo = getUserFromRequest(request);
        if (!userInfo) {
            return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
        }

        const favorites = await Favorite.find({ userId: userInfo.userId })
            .sort({ createdAt: -1 })
            .select('bookId createdAt');

        return NextResponse.json({
            favorites,
            count: favorites.length
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching favorites:", error);
        return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }
}

// POST - Añadir un libro a favoritos de un usuario
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const userInfo = getUserFromRequest(request);
        if (!userInfo) {
            return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
        }

        const { bookId } = await request.json();

        if (!bookId) {
            return new Response(JSON.stringify({ message: "bookId is required" }), { status: 400 });
        }

        const existingFavorite = await Favorite.findOne({ userId: userInfo.userId, bookId });
        if (existingFavorite) {
            return new Response(JSON.stringify({ message: "Book is already in favorites" }), { status: 400 });
        }

        const favorite = await Favorite.create({
            userId: userInfo.userId,
            bookId
        });

        return NextResponse.json({
            message: "Book added to favorites",
            favorite 
        }, { status: 201 });

    } catch (error) {
        console.error("Error adding favorite:", error);

        return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }
}

// DELETE - Eliminar un libro de favoritos de un usuario
export async function DELETE(request: NextRequest) {
    try {
        await connectDB();

        const userInfo = getUserFromRequest(request);
        if (!userInfo) {
            return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
        }

        const { bookId } = await request.json();

        if (!bookId) {
            return new Response(JSON.stringify({ message: "bookId is required" }), { status: 400 });
        }

        const deletedFavorite = await Favorite.findOneAndDelete({ userId: userInfo.userId, bookId });
        if (!deletedFavorite) {
            return new Response(JSON.stringify({ message: "Favorite not found" }), { status: 404 });
        }

        return NextResponse.json({
            message: "Book removed from favorites"
        }, { status: 200 });
        
    } catch (error) {
        console.error("Error removing favorite:", error);
        return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }
}