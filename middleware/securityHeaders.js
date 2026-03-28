"use strict";

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://unpkg.com; " +
      "img-src 'self' data:; " +
      "connect-src 'self'; " +
      "form-action 'self'; " +
      "frame-ancestors 'self'; " +
      "base-uri 'self';",
  );

  next();
}

module.exports = securityHeaders;
