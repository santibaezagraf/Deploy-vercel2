import mongoose from "mongoose";
import { unique } from "next/dist/build/utils";

const reviewSchema = new mongoose.Schema({
    bookId: {
        type: String,
        required: [ true, 'El ID del libro es obligatorio' ],
        index: true
    }, 
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Nota: debería ser ObjectId, no String
        ref: 'User',
        required: [ true, 'El ID del usuario es obligatorio' ],
        index: true
    },
    username: {
        type: String,
        trim: true,
        required: [ true, 'El nombre del usuario es obligatorio' ]
    },
    rating: {
        type: Number,
        required: [ true, 'La calificación es obligatoria' ],
        min: [1, 'La calificación mínima es 1'],
        max: [5, 'La calificación máxima es 5']
    },
    comment: {
        type: String,
        required: [ true, 'El comentario es obligatorio' ],
        trim: true,
        minlength: [5, 'El comentario debe tener al menos 5 caracteres'],
        maxlength: [1000, 'El comentario no debe exceder los 1000 caracteres']
    },

    // Contadores de votos
    likesCount: {
        type: Number,
        default: 0,
        min: [0, 'Los likes no pueden ser negativos']
    },
    dislikesCount: {
        type: Number,
        default: 0,
        min: [0, 'Los dislikes no pueden ser negativos']
    }
}, { timestamps: true });

// Índice compuesto para evitar que un usuario haga múltiples reviews al mismo libro
reviewSchema.index({ bookId: 1, userId: 1 }, { unique: true });
// Índices para optimizar consultas comunes
reviewSchema.index({ bookId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });

// Virtual para total de votos
reviewSchema.virtual('totalVotes').get(function() {
    return this.likesCount + this.dislikesCount
})

export default mongoose.models.Review || mongoose.model('Review', reviewSchema);

// Ejemplos de consultas comunes:
// 1. Obtener todas las reviews de un libro específico, ordenadas por fecha (más recientes primero)
//    Review.find({ bookId: "abc123" }).sort({ createdAt: -1 })
// 2. Obtener todas las reviews de un usuario específico
//    Review.find({ userId: "userId123" })
// 3. Votar (like/dislike) una review específica
//    Review.findByIdAndUpdate(reviewId, { $inc: { likes: 1 } })  // para like
//    Review.findByIdAndUpdate(reviewId, { $inc: { dislikes: 1 } })  // para dislike

// Consideraciones de diseño:
// - Asegurarse de que los índices estén optimizados para las consultas más comunes.
// - Considerar la posibilidad de agregar más campos en el futuro y cómo afectaría eso a la estructura actual.
// - Evaluar si es necesario almacenar un historial de votos para evitar múltiples votos del mismo usuario.
// - Monitorizar el rendimiento de las consultas y ajustar índices según sea necesario.