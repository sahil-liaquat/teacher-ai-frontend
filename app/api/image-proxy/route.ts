/**
 * Server-side image proxy route.
 * Fetches any public http/https image URL from the server (no CORS restrictions)
 * and streams it back to the browser with permissive CORS headers.
 * Used by the PPTX/PDF export to embed images that block browser-side fetch.
 */
import { type NextRequest, NextResponse } from "next/server";

const ALLOWED_SCHEMES = ["http:", "https:"];

// Block requests to private/loopback IP ranges to prevent SSRF
const PRIVATE_IP_REGEX =
  /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1|fd[0-9a-f]{2}:)/i;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
    return NextResponse.json({ error: "Scheme not allowed" }, { status: 403 });
  }

  if (PRIVATE_IP_REGEX.test(parsed.hostname)) {
    return NextResponse.json({ error: "Private host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TeachPad/1.0)",
        Accept: "image/*,*/*;q=0.8",
      },
      // Next.js server-side fetch — no browser CORS restrictions apply
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 415 });
    }

    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch upstream" }, { status: 502 });
  }
}
