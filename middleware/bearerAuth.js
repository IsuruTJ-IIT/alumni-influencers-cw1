"use strict";

const apiTokenDao = require("../dao/apiTokenDao");
const { hashToken } = require("../services/tokenService");

async function bearerAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing bearer token.",
      });
    }

    const plainToken = authHeader.split(" ")[1].trim();

    if (!plainToken) {
      return res.status(401).json({
        success: false,
        message: "Missing bearer token.",
      });
    }

    const tokenHash = hashToken(plainToken);
    const tokenRow = await apiTokenDao.findActiveTokenByHash(tokenHash);

    if (!tokenRow) {
      return res.status(401).json({
        success: false,
        message: "Invalid, revoked, or expired token.",
      });
    }

    req.apiToken = tokenRow;

    await apiTokenDao.touchTokenLastUsed(tokenRow.id);
    await apiTokenDao.logApiUsage({
      apiTokenId: tokenRow.id,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      ipAddress: req.ip,
    });

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
}

module.exports = bearerAuth;
