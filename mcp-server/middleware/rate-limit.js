// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// middleware/rate-limit.js — In-memory token bucket rate limiter per IP.

function createRateLimiter(maxRequests) {
  const buckets = new Map();
  const windowMs = 60000; // 1 minute window

  // Clean up old entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, bucket] of buckets) {
      if (now - bucket.windowStart > windowMs * 2) {
        buckets.delete(ip);
      }
    }
  }, 300000).unref();

  return function rateLimiter(req) {
    const ip = req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let bucket = buckets.get(ip);
    if (!bucket || now - bucket.windowStart > windowMs) {
      bucket = { windowStart: now, count: 0 };
      buckets.set(ip, bucket);
    }

    bucket.count += 1;

    if (bucket.count > maxRequests) {
      const retryAfter = Math.ceil((bucket.windowStart + windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }

    return { allowed: true };
  };
}

module.exports = { createRateLimiter };
