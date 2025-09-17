import { getUserFromRequest } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import { NextRequest, NextResponse } from "next/server";


interface Params {
    id: string;
}

// PUT - actualizar un review (solo el autor)

export async function PUT(request: NextRequest, { params }: { params: Promise<Params> }) {
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

        const { comment, rating } = await request.json();
        const { id } = await params;

        const review = await Review.findById(id);
        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Verificar que el usuario sea el autor del review
        if (review.userId.toString() !== userInfo.userId) {
            return NextResponse.json({ error: 'Only the author can update the review' }, { status: 403 });
        }

        // Actualizar campos
        if (comment) review.comment = comment;
        if (rating) review.rating = rating;
        // Actualizar la fecha de actualización
        review.updatedAt = new Date();
        await review.save();

        return NextResponse.json({ 
            message: 'Review updated successfully',
            review: {
                ... review.toObject(),
                id: review._id.toString(),
                userId: review.userId.toString(),
            }}, { status: 200 }
        );
    } catch (error) {
        console.error("Error updating review:", error);
        return NextResponse.json({ error: "Error updating review" }, { status: 500 });
    }
}

// DELETE - eliminar un review (solo el autor)
export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
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

        const { id } = await params;

        const review = await Review.findById(id);
        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Verificar que el usuario sea el autor del review
        if (review.userId.toString() !== userInfo.userId) {
            return NextResponse.json({ error: 'Only the author can delete the review' }, { status: 403 });
        }

        await Review.findByIdAndDelete(id);

        return NextResponse.json({ 
            message: 'Review deleted successfully'
        }, { status: 200 });
    } catch (error) {
        console.error("Error deleting review:", error);
        return NextResponse.json({ error: "Error deleting review" }, { status: 500 });
    }
}

// // votar (like/dislike) un review
// export async function POST(request: NextRequest, { params }: { params: Params }) {
//     try {
//         await connectDB();

//         const userId = request.headers.get('x-user-id');
//         if (!userId) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//         }

//         const { vote } = await request.json();
//         if (vote !== 'like' && vote !== 'dislike') {
//             return NextResponse.json({ error: 'Vote must be either "like" or "dislike"' }, { status: 400 });
//         }

//         const review = await Review.findById(params.id);
//         if (!review) {
//             return NextResponse.json({ error: 'Review not found' }, { status: 404 });
//         }

//         // No puede votarse a sí mismo
//         if (review.userId.toString() === userId) {
//             return NextResponse.json({ error: 'You cannot vote your own review' }, { status: 403 });
//         }
//     } catch (error) {
//         console.error("Error processing vote:", error);
//         return NextResponse.json({ error: "Error processing vote" }, { status: 500 });
//     }
// }