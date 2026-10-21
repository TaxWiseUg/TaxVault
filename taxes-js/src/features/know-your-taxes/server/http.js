import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "./auth";
import { NotFoundError } from "./repository";
/** Uniform error mapping. Never leaks stack traces or other users' data. */
export function handle(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
      if (e instanceof NotFoundError) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (e instanceof ZodError)
        return NextResponse.json(
          { error: "Invalid input", issues: e.issues.map((i) => ({ path: i.path, message: i.message })) },
          { status: 400 },
        );
      console.error("[know-your-taxes]", e);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}
const hits = new Map();
/** Minimal in-memory limiter for the AI endpoint. Swap for your existing limiter (Upstash, etc.) in production. */
export function rateLimit(key, max = 20, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) return false;
  arr.push(now);
  hits.set(key, arr);
  return true;
}
