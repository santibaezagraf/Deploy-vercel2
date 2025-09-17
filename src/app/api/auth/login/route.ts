import { generateTokenPair } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const { email, password } = await request.json();

        //validaciones
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }   

        const user = await User.findOne({ email });
        if (!user || !user.isActive) {
            return NextResponse.json(
                { error: "User does not exist or is not active" },
                { status: 401 }
            );
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 401 }
            );
        }

        // Generar par de tokens
        const { accessToken, refreshToken } = generateTokenPair(user._id.toString());

        const response = NextResponse.json({
            message: "Login successful",
            // accessToken,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
            },
        })

        // Establecer ambas cookies httpOnly
        response.cookies.set("access-token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 2, // 2 horas
            path: '/',
        });

        response.cookies.set("refresh-token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7, // 7 días
            path: '/',
        });

        return response;
    } catch (error) {
        console.error("Error logging in:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}