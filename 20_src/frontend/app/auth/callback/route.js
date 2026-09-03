import { NextResponse } from "next/server";

export async function GET(request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/signup";
  const dest = new URL(next, url.origin);
  const code = url.searchParams.get("code");
  if (code) dest.searchParams.set("code", code);
  return NextResponse.redirect(dest);
}
