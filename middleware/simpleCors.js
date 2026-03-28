"use strict";

function simpleCors(req, res, next) {
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500"
  )
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const requestOrigin = req.headers.origin;

  if (!requestOrigin) {
    return next();
  }

  if (allowedOrigins.includes(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type",
    );
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
}

module.exports = simpleCors;
