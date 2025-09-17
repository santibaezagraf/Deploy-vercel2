import { getUserFromRequest } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

interface ReviewLean {
    _id: mongoose.Types.ObjectId;
    bookId: string;
    userId: mongoose.Types.ObjectId;
    userName: string;
    rating: number;
    comment: string;
    likesCount: number;
    dislikesCount: number;
    createdAt: Date;
    updatedAt: Date;
}

// GET 
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        const bookId = searchParams.get('bookId');
        const userId = searchParams.get('userId');

        const filter: { bookId?: string; userId?: mongoose.Types.ObjectId } = {};
        if (bookId) filter.bookId = bookId;
        if (userId) filter.userId = new mongoose.Types.ObjectId(userId);

        const reviews = await Review.find(filter)
            .sort({ createdAt: -1 })
            .lean<ReviewLean[]>();

        return NextResponse.json({
            reviews: reviews.map(review => ({
                ...review,
                id: review._id.toString(),
                userId: review.userId.toString(),
            }))
        })
    

    } catch (error) {
        console.error("Error fetching reviews:", error);
        return NextResponse.json({ error: "Error fetching reviews" }, { status: 500 });
    }

}

// POST 
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        // Obtener userId del header (establecido por el middleware)
        // const userId = request.headers.get('x-user-id');
        // if (!userId) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        // Obtener userId del token
        const userInfo = getUserFromRequest(request);
        if (!userInfo) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { bookId, username, rating, comment } = await request.json();

        console.log('Datos recibidos:', { bookId, username, rating, comment });

        // Validaciones básicas
        if (!bookId || !username || !rating || !comment) {
            return NextResponse.json(
                { error: 'Todos los campos son requeridos' },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'La calificación debe estar entre 1 y 5' },
                { status: 400 }
            );
        }

        if (comment.length < 5 || comment.length > 1000) {
            return NextResponse.json(
                { error: 'El comentario debe tener entre 5 y 1000 caracteres' },
                { status: 400 }
            );
        }

        // Validar que el usuario no haya creado una reseña previamente
        const existingReview = await Review.findOne({ bookId, userId: userInfo.userId });
        if (existingReview) {
            return NextResponse.json({ error: 'Ya has creado una reseña para este libro' }, { status: 400 });
        }

        // Obtener datos del usuario (opcional, para validar existencia)
        const user = await User.findById(userInfo.userId);
        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // Crear review
        const review = await Review.create({
            bookId,
            userId: new mongoose.Types.ObjectId(userInfo.userId),
            username,
            rating,
            comment,
            likesCount: 0,
            dislikesCount: 0
        })

        return NextResponse.json({
            message: 'Review creada exitosamente',
            review: {
                ...review.toObject(),
                id: review._id.toString(),
                userId: review.userId.toString(),
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating review:", error);
        return NextResponse.json({ error: "Error creando review" }, { status: 500 });
    }
}