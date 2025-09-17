import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Review from "@/models/Review";
import userVote from "@/models/userVote";
import { get } from "http";
import { getUserFromRequest } from "@/lib/auth";


export async function POST(request: NextRequest) {
    try {
        await connectDB();

        // const userId = request.headers.get('x-user-id');
        // if (!userId) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const userInfo = getUserFromRequest(request);
        if (!userInfo) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validar input
        const { reviewId, like } = await request.json();
        if (!reviewId || like === undefined || typeof like !== 'boolean') {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        console.log('Datos recibidos:', { reviewId, like });

        // Validar que reviewId es un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return NextResponse.json({ error: 'review not found' }, { status: 404 });
        }

        // No permitimos que el autor del review vote su propia review
        if (review.userId.toString() === userInfo.userId) {
            return NextResponse.json({ error: 'You cannot vote your own review' }, { status: 403 });
        }

        // TRANSACCION - para asegurar consistencia entre UserVote y Review
        const session = await mongoose.startSession();
        

        try {
            await session.withTransaction(async () => {
                console.log('Iniciando transacción para registrar voto...');
                // Buscar voto existente
                const existingVote = await userVote.findOne({ userId: userInfo.userId, reviewId }).session(session);

                if (existingVote) {
                    console.log('Voto existente encontrado:', existingVote);
                    // Si el voto es el mismo, lo removemos
                    if (existingVote.like === like) {
                        await userVote.findByIdAndDelete(existingVote._id).session(session);

                        // Decrementar el contador correspondiente en Review
                        if (like) {
                            review.likesCount = Math.max(0, review.likesCount - 1);
                        } else {
                            review.dislikesCount = Math.max(0, review.dislikesCount - 1);
                        }
                    } else {
                        // Si el voto es diferente, actualizamos
                        existingVote.like = like;
                        await existingVote.save({ session });

                        // Actualizar contadores en Review
                        if (like) {
                            review.likesCount += 1;
                            review.dislikesCount = Math.max(0, review.dislikesCount - 1);
                        } else {
                            review.dislikesCount += 1;
                            review.likesCount = Math.max(0, review.likesCount - 1);
                        }
                    }
                } else {
                    // Crear nuevo voto
                    console.log('Creando nuevo voto con info:', { userId: userInfo.userId, reviewId, like });
                    await userVote.create([{ userId: userInfo.userId, reviewId, like }], { session });

                    if (like) {
                        console.log('Incrementando likesCount, antes es de ' + review.likesCount);
                        review.likesCount += 1;
                        console.log('Nuevo likesCount: ' + review.likesCount);  
                    } else {
                        console.log('Incrementando dislikesCount, antes es de ' + review.dislikesCount);
                        review.dislikesCount += 1;
                        console.log('Nuevo dislikesCount: ' + review.dislikesCount);
                    }
                }

                await review.save({ session });

            })
        } finally {
            await session.endSession();
        }

        const [updatedReview, totalVotes] = await Promise.all([
            Review.findById(reviewId),
            userVote.countDocuments({ reviewId })
        ]);

        return NextResponse.json({
            message: 'Vote recorded successfully',
            review: updatedReview,
            totalVotes
        }, { status: 200 });
    } catch (error) {
        console.error("Error recording vote:", error);
        return NextResponse.json({ error: "Error recording vote" }, { status: 500 });
    }
}

// GET booleano que indica si el usuario actual ha votado un review específico
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const userInfo = getUserFromRequest(request);
        if (!userInfo) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const reviewId = searchParams.get('reviewId');

        if (!reviewId) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }
        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return NextResponse.json({ error: 'review not found' }, { status: 404 });
        }

        const userVoteDoc = await userVote.findOne({ userId: userInfo.userId, reviewId });

        return NextResponse.json({
            userVote: userVoteDoc ? (userVoteDoc.like ? 'like' : 'dislike') : null
        }, { status: 200 });


    } catch (error) {
        console.error("Error fetching user vote:", error);
        return NextResponse.json({ error: "Error fetching user vote" }, { status: 500 });
    }
}

// GET - obtener votos de un review
// export async function GET(request: NextRequest) {
//     try {
//         await connectDB();
//
//         const { searchParams } = new URL(request.url);
//         const reviewId = searchParams.get('reviewId');
//         const userId = request.headers.get('x-user-id');
//     }
// }