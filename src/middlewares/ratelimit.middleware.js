import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Create rate limiter - 100 requests per 15 minutes
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "15 m"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

export const rateLimitMiddleware = async (req, res, next) => {
  try {
    // Use IP address as identifier
    // In the future, you can use userId for authenticated requests
    const identifier = req.ip || req.connection.remoteAddress || "anonymous";

    console.log(`Rate limit check for IP: ${identifier}`);

    const { success, limit, reset, remaining } =
      await ratelimit.limit(identifier);

    // Add rate limit info to response headers
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", new Date(reset).toISOString());

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      console.log(`Rate limit exceeded for IP: ${identifier}`);

      return res.status(429).json({
        error: "Too many requests",
        message: "You have exceeded the rate limit. Please try again later.",
        retryAfter: retryAfter,
        limit: limit,
        reset: new Date(reset).toISOString(),
      });
    }

    console.log(
      `Rate limit OK for IP: ${identifier} (${remaining}/${limit} remaining)`,
    );
    next();
  } catch (error) {
    console.error("Rate limit error:", error);
    // On error, allow the request (fail open)
    // This ensures your app keeps working even if Upstash is down
    next();
  }
};
