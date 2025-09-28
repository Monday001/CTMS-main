import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = NextResponse.json({
      message: "Logout successful",
      success: true,
    });

    // clear the JWT cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      expires: new Date(0), // expire immediately
      path: "/",            // clear the whole site
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
