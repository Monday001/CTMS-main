import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CTMS",
  description: "Developed by Brian Barasa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter?.className}>
        {/* ✅ Global Toaster */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1E3A8A", // Tailwind blue-900
              color: "#fff",
              borderRadius: "8px",
              padding: "12px 16px",
            },
            success: {
              style: {
                background: "#10B981", // Tailwind green-500
              },
            },
            error: {
              style: {
                background: "#EF4444", // Tailwind red-500
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
