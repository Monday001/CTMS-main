import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export function verifyToken() {
  try {
    // 1. Read token from cookies
    const token = cookies().get("token")?.value;
    if (!token) {
      console.warn("❌ No token found in cookies");
      return null;
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET!);

    // 3. Return decoded user info (id, username, email, role)
    return decoded;
  } catch (error) {
    console.error("❌ Invalid token:", error);
    return null;
  }
}
