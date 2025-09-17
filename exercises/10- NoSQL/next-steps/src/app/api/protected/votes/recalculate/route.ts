import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Review from "@/models/Review";
import userVote from "@/models/userVote";

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        console.log('🔄 Iniciando recalculación de contadores de votos...');

        // Obtener todos los reviews
        const reviews = await Review.find({});
        console.log(`📊 Encontrados ${reviews.length} reviews para recalcular`);

        let updatedCount = 0;
        let errors = 0;

        // Procesar cada review
        for (const review of reviews) {
            try {
                // Contar votos reales desde userVote collection
                const [likesCount, dislikesCount] = await Promise.all([
                    userVote.countDocuments({ reviewId: review._id, like: true }),
                    userVote.countDocuments({ reviewId: review._id, like: false })
                ]);

                // Solo actualizar si hay diferencias
                if (review.likesCount !== likesCount || review.dislikesCount !== dislikesCount) {
                    console.log(`📝 Review ${review._id}: 
                        Likes: ${review.likesCount} → ${likesCount}
                        Dislikes: ${review.dislikesCount} → ${dislikesCount}`);

                    await Review.findByIdAndUpdate(review._id, {
                        likesCount,
                        dislikesCount
                    });

                    updatedCount++;
                }
            } catch (error) {
                console.error(`❌ Error procesando review ${review._id}:`, error);
                errors++;
            }
        }

        console.log(`✅ Recalculación completada: ${updatedCount} reviews actualizados, ${errors} errores`);

        return NextResponse.json({
            success: true,
            message: 'Contadores recalculados exitosamente',
            totalReviews: reviews.length,
            updatedReviews: updatedCount,
            errors
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error en recalculación:', error);
        return NextResponse.json({
            success: false,
            error: 'Error recalculando contadores'
        }, { status: 500 });
    }
}

// GET - Verificar inconsistencias sin corregir
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        console.log('🔍 Verificando inconsistencias en contadores...');

        const reviews = await Review.find({});
        const inconsistencies = [];

        for (const review of reviews) {
            const [actualLikes, actualDislikes] = await Promise.all([
                userVote.countDocuments({ reviewId: review._id, like: true }),
                userVote.countDocuments({ reviewId: review._id, like: false })
            ]);

            if (review.likesCount !== actualLikes || review.dislikesCount !== actualDislikes) {
                inconsistencies.push({
                    reviewId: review._id,
                    bookId: review.bookId,
                    current: {
                        likes: review.likesCount,
                        dislikes: review.dislikesCount
                    },
                    actual: {
                        likes: actualLikes,
                        dislikes: actualDislikes
                    }
                });
            }
        }

        return NextResponse.json({
            totalReviews: reviews.length,
            inconsistentReviews: inconsistencies.length,
            inconsistencies
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error verificando inconsistencias:', error);
        return NextResponse.json({
            error: 'Error verificando inconsistencias'
        }, { status: 500 });
    }
}