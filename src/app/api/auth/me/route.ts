import { getUserFromRequest } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const userInfo = getUserFromRequest(request);
        if (!userInfo) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await User.findById(userInfo.userId).select("-password");
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
            }
        });
    } catch (error) {
        console.error("Error fetching user info:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}