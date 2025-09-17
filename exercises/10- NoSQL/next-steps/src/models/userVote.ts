import mongoose from "mongoose";

const userVoteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [ true, 'El ID del usuario es obligatorio' ],
        index: true
    },
    reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        required: [ true, 'El ID de la review es obligatorio' ],
    },
    like: {
        type: Boolean,
        required: [ true, 'El voto (like/dislike) es obligatorio' ]
    }
}, {
    timestamps: true
})

// Índice compuesto para evitar que un usuario vote múltiples veces la misma review
userVoteSchema.index({ userId: 1, reviewId: 1 }, { unique: true });

// Indice para optimizar consultas
userVoteSchema.index({ reviewId: 1, like: 1 });
userVoteSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.UserVote || mongoose.model('UserVote', userVoteSchema);