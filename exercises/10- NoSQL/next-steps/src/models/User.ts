import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    username: {
        type: String,
        required: [true, 'El nombre de usuario es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre de usuario debe tener al menos 2 caracteres'],
        maxlength: [50, 'El nombre de usuario no debe exceder los 50 caracteres']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true 
});

// Middleware para hash de password
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Método para comparar password
userSchema.methods.comparePassword = function(candidate: string) {
    return bcrypt.compare(candidate, this.password);
};

// Evita re-compilar el modelo si ya existe (importante en desarrollo)
export default mongoose.models.User || mongoose.model('User', userSchema)