"use strict";

const db = require("../config/database");

async function createApiToken({
  developerUserId,
  tokenName,
  tokenHash,
  scopeName = "read:alumni_of_day",
  clientType = "mobile_ar_app",
  expiresAt = null,
}) {
  const [result] = await db.execute(
    `INSERT INTO api_tokens
       (developer_user_id, token_name, token_hash, scope_name, client_type, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [developerUserId, tokenName, tokenHash, scopeName, clientType, expiresAt]
  );

  return result.insertId;
}
async function getTokensWithUsageSummaryByUser(userId) {
  const [rows] = await db.execute(
    `SELECT
       t.id,
       t.token_name,
       t.scope_name,
       t.client_type,
       t.is_revoked,
       t.expires_at,
       t.last_used_at,
       t.created_at,
       COUNT(l.id) AS usage_count
     FROM api_tokens t
     LEFT JOIN api_usage_logs l ON l.api_token_id = t.id
     WHERE t.developer_user_id = ?
     GROUP BY
       t.id,
       t.token_name,
       t.scope_name,
       t.client_type,
       t.is_revoked,
       t.expires_at,
       t.last_used_at,
       t.created_at
     ORDER BY t.created_at DESC`,
    [userId],
  );

  return rows;
}

async function getUsageLogsByUser(userId) {
  const [rows] = await db.execute(
    `SELECT
       l.*,
       t.token_name
     FROM api_usage_logs l
     INNER JOIN api_tokens t ON t.id = l.api_token_id
     WHERE t.developer_user_id = ?
     ORDER BY l.used_at DESC
     LIMIT 50`,
    [userId],
  );

  return rows;
}

async function revokeToken(userId, tokenId) {
  await db.execute(
    `UPDATE api_tokens
     SET is_revoked = TRUE
     WHERE id = ? AND developer_user_id = ?`,
    [tokenId, userId],
  );
}

async function findActiveTokenByHash(tokenHash) {
  const [rows] = await db.execute(
    `SELECT * FROM api_tokens
     WHERE token_hash = ?
       AND is_revoked = FALSE
       AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1`,
    [tokenHash],
  );

  return rows[0] || null;
}

async function touchTokenLastUsed(tokenId) {
  await db.execute(
    `UPDATE api_tokens
     SET last_used_at = NOW()
     WHERE id = ?`,
    [tokenId],
  );
}

async function logApiUsage({ apiTokenId, endpoint, httpMethod, ipAddress }) {
  await db.execute(
    `INSERT INTO api_usage_logs (api_token_id, endpoint, http_method, ip_address)
     VALUES (?, ?, ?, ?)`,
    [apiTokenId, endpoint, httpMethod, ipAddress],
  );
}

module.exports = {
  createApiToken,
  getTokensWithUsageSummaryByUser,
  getUsageLogsByUser,
  revokeToken,
  findActiveTokenByHash,
  touchTokenLastUsed,
  logApiUsage,
};
