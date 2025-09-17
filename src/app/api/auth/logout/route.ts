import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({
        message: "Logout successful",
    });

    // Limpiar cookies
    response.cookies.set("access-token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0, // Expira inmediatamente
    });
    response.cookies.set("refresh-token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0, // Expira inmediatamente
    });

    return response;
}