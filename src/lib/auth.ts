import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export function verifyToken(request?: NextRequest) {
  try {
    const token = cookies().get("token")?.value;
    if (!token) {
      console.warn("❌ No token found in cookies");
      if (request) {
        const redirect = NextResponse.redirect(new URL("/login", request.url));
        return { valid: false, response: redirect };
      }
      return { valid: false, user: null };
    }

    const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET!);
    return { valid: true, user: decoded };
  } catch (error) {
    console.error("❌ Invalid token:", error);
    if (request) {
      const redirect = NextResponse.redirect(new URL("/login", request.url));
      return { valid: false, response: redirect };
    }
    return { valid: false, user: null };
  }
}
