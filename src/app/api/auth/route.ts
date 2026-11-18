import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/b2";

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD || !isAuthorized(req)) {
    return NextResponse.json(
      { authorized: false, error: "Invalid passphrase" },
      { status: 401 }
    );
  }

  return NextResponse.json({ authorized: true });
}

