import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [ true, "User ID is required" ],
        index: true
    },
    bookId: {
        type: String,
        required: [ true, "Book ID is required" ],
        index: true
    },
}, { timestamps: true }
);

// indice compuesto para evitar duplicados de favoritos por usuario y libro
favoriteSchema.index({ userId: 1, bookId: 1 }, { unique: true });

favoriteSchema.index({ userId: 1, createdAt: -1 }); // Para listar favoritos de un usuario por fecha
favoriteSchema.index({ bookId: 1 , createdAt: -1 }); // Para buscar favoritos por libro y fecha

export default mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);;
