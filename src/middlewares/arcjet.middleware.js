import { aj } from "../config/arcjet.js";

export const arcjetMiddleware = async (req, res, next) => {
  try {
    // Extract IP from proxy headers (Render uses X-Forwarded-For)
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.headers["x-real-ip"] ||
      req.ip ||
      req.connection.remoteAddress;

    // Add IP to request object for Arcjet
    req.ip = ip;

    const decision = await aj.protect(req, { requested: 1 });

    console.log(`Arcjet decision for IP ${ip}:`, {
      conclusion: decision.conclusion,
      reason: decision.reason,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ error: "Too Many Requests" });
      } else if (decision.reason.isBot()) {
        return res.status(403).json({ error: "Bot detected" });
      } else {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    next();
  } catch (error) {
    console.log("Arcjet error", error);
    next(error);
  }
};
