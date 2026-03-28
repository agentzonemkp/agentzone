import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export async function middleware(req: NextRequest) {
  // Only apply to /api/v1 routes
  if (!req.nextUrl.pathname.startsWith('/api/v1')) {
    return NextResponse.next();
  }

  // Skip auth/keys/public agents endpoints from auth
  if (
    req.nextUrl.pathname.startsWith('/api/v1/keys') ||
    req.nextUrl.pathname.startsWith('/api/auth') ||
    req.nextUrl.pathname.startsWith('/api/v1/agents') ||
    req.nextUrl.pathname.startsWith('/api/v1/stats') ||
    req.nextUrl.pathname.startsWith('/api/v1/payments')
  ) {
    return NextResponse.next();
  }

  const apiKey = req.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
  }

  const keyHash = createHash('sha256').update(apiKey).digest('hex');

  // Verify key
  const keyRecord = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.key_hash, keyHash))
    .limit(1);

  if (keyRecord.length === 0 || !keyRecord[0].active) {
    return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 401 });
  }

  const key = keyRecord[0];

  // Rate limiting
  const now = Date.now();
  const minuteKey = `${keyHash}:${Math.floor(now / 60000)}`;

  const rateLimit = rateLimitStore.get(minuteKey) || { count: 0, resetAt: now + 60000 };

  if (rateLimit.count >= (key.rate_limit_per_minute || 60)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: Math.ceil((rateLimit.resetAt - now) / 1000) },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': key.rate_limit_per_minute.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetAt / 1000).toString(),
        },
      }
    );
  }

  rateLimit.count++;
  rateLimitStore.set(minuteKey, rateLimit);

  // Update last_used
  await db.update(apiKeys).set({ last_used: new Date() }).where(eq(apiKeys.id, key.id));

  // Add rate limit headers
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', key.rate_limit_per_minute.toString());
  response.headers.set(
    'X-RateLimit-Remaining',
    (key.rate_limit_per_minute - rateLimit.count).toString()
  );
  response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetAt / 1000).toString());

  return response;
}

export const config = {
  matcher: '/api/v1/:path*',
};
