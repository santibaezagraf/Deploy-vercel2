import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

if (!process.env.JWT_SECRET) {
    throw new Error('Please define the JWT_SECRET environment variable inside .env.local');
}
const JWT_SECRET = process.env.JWT_SECRET;

if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('Please define the JWT_REFRESH_SECRET environment variable inside .env.local');
}
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

// export function generateToken(userId: string): string {
//     return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '2d' });
// }

// export function verifyToken(token: string): {userId: string} | null {
//     try {
//         return jwt.verify(token, JWT_SECRET) as {userId: string};
//     } catch (error) {
//         console.error('Token verification error:', error);
//         return null;
//     }
// }

// ACCESS TOKEN (15 min)
export function generateAccessToken(userId: string): string {
    return jwt.sign(
        { userId, type: 'access' },
        JWT_SECRET,
        { expiresIn: '15m' }
    );
}

export function verifyAccessToken(token: string): {userId: string} | null {
    try {
        const payload = jwt.verify(token, JWT_SECRET) as {userId: string, type: string};
        if (payload.type !== 'access') {
            return null;
        }
        return { userId: payload.userId };
    } catch (error) {
        console.error('Error verifying access token:', error);
        return null;
    }
}

// REFRESH TOKEN (7 days)
export function generateRefreshToken(userId: string): string {
    return jwt.sign(
        { userId, type: 'refresh' },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
}

export function verifyRefreshToken(token: string): {userId: string} | null {
    try {
        const payload = jwt.verify(token, JWT_REFRESH_SECRET) as {userId: string, type: string};
        if (payload.type !== 'refresh') {
            return null;
        }
        return { userId: payload.userId };
    } catch (error) {
        console.error('Error verifying refresh token:', error);
        return null;
    }
}

// Generar par de tokens
export function generateTokenPair(userId: string) {
    return {
        accessToken: generateAccessToken(userId),
        refreshToken: generateRefreshToken(userId)
    };
}

export function getUserFromRequest(req: NextRequest): {userId: string} | null {
    // Priority to Authorization header
    let token = req.headers.get('Authorization')?.replace('Bearer ', '');

    // Fallback to cookie if no token in header
    if (!token) {
        token = req.cookies.get('access-token')?.value;
    }

    if (!token) return null;

    
    
    return verifyAccessToken(token);
}

// Funciones legacy
export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;