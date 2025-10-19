import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth"; // Assuming verifyToken is located here

/**
 * GET handler to check for an active user session by verifying the auth token.
 * @route GET /api/users/check-session
 */
export async function GET(request: NextRequest) {
    try {
        // Use the common verification function to check the token's validity.
        // We only care about the 'valid' flag for this session check endpoint.
        const { valid } = verifyToken(request);
        
        if (valid) {
            console.log("SERVER LOG: check-session - Token successfully verified. Session valid.");
            // Return { valid: true } for the client-side AdminLayout check
            return NextResponse.json({ valid: true }, { status: 200 });
        } else {
            console.log("SERVER LOG: check-session - Token failed verification or was missing. Session invalid.");
            // If the token is invalid or missing, we return { valid: false }. 
            // The client-side AdminLayout is expecting this structure to handle the redirect.
            return NextResponse.json({ valid: false, message: "Session invalid or expired" }, { status: 200 });
        }
    } catch (error) {
        console.error("SERVER ERROR: check-session - Failed during session check:", error);
        return NextResponse.json(
            { valid: false, message: "Internal server error during session check" },
            { status: 500 }
        );
    }
}
