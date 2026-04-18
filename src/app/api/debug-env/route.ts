import { NextResponse } from "next/server";

export async function GET() {
  const diagnostics = {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ PRESENT" : "❌ MISSING",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? `✅ PRESENT (${process.env.NEXTAUTH_URL})` : "❌ MISSING",
    MONGODB_URI: process.env.MONGODB_URI ? "✅ PRESENT" : "❌ MISSING",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL ? "Yes" : "No",
  };

  return NextResponse.json({
    status: "Service Diagnostic",
    environment: diagnostics,
    instructions: "If any are MISSING, you must add them to your Vercel Dashboard > Project Settings > Environment Variables."
  });
}
