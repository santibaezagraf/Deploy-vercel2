import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El ID del usuario es obligatorio'],
        index: true
    },
    bookId: {
        type: String, // Consistente con Review.ts
        required: [true, 'El ID del libro es obligatorio'],
        index: true
    },
    // Campo opcional para notas del usuario
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Las notas no deben exceder los 500 caracteres']
    }
}, {
    timestamps: true // Esto agrega automáticamente createdAt y updatedAt
});

// Índice compuesto único para evitar duplicados
favoriteSchema.index({ userId: 1, bookId: 1 }, { unique: true });

// Índices para optimizar consultas comunes
favoriteSchema.index({ userId: 1, createdAt: -1 }); // Para listar favoritos de un usuario por fecha
favoriteSchema.index({ bookId: 1, createdAt: -1 }); // Para estadísticas por libro

export default mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);