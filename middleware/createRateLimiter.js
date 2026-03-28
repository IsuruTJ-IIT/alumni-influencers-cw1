"use strict";

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || 5;
  const store = new Map();

  return function rateLimiter(req, res, next) {
    const key = `${req.ip}:${req.originalUrl}`;
    const now = Date.now();

    const existing = store.get(key) || [];
    const recent = existing.filter((timestamp) => now - timestamp < windowMs);

    if (recent.length >= maxRequests) {
      return res.status(429).send("Too many requests. Please try again later.");
    }

    recent.push(now);
    store.set(key, recent);

    next();
  };
}

module.exports = createRateLimiter;
