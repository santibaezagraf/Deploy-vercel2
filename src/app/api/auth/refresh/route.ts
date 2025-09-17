import { generateTokenPair, verifyRefreshToken } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
    try {
        await connectDB();

        // Obtener refresh token de las cookies o body
        const refreshToken = request.cookies.get("refreshToken")?.value || (await request.json()).refreshToken;

        if (!refreshToken) {
            return NextResponse.json(
                { error: "Refresh token is required" },
                { status: 401 }
            );
        }

        // Verificar que el refresh token es válido
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return NextResponse.json(
                { error: "Invalid or expired refresh token" },
                { status: 401 }
            );
        }

        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return NextResponse.json(
                { error: "User not found or inactive" },
                { status: 401 }
            );
        }

        // GENERAR NUEVOS TOKENS
        const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user._id.toString());

        const response = NextResponse.json({
            message: "Tokens refreshed successfully",
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
            },
        });

        // Establecer nueva cookie httpOnly para el refresh token
        response.cookies.set("access-token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 15, // 15 minutos
        });

        response.cookies.set("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7, // 7 días
        });

        return response;
    } catch (error) {
        console.error("Error refreshing tokens:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
            
} 