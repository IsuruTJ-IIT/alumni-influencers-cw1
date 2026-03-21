"use strict";

const db = require("../config/database");

async function findUserByEmail(email) {
  const [rows] = await db.execute(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await db.execute("SELECT * FROM users WHERE id = ? LIMIT 1", [
    id,
  ]);
  return rows[0] || null;
}

async function createUser({ fullName, email, passwordHash, role = "alumnus" }) {
  const [result] = await db.execute(
    "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [fullName, email, passwordHash, role],
  );
  return result.insertId;
}

async function markUserVerified(userId) {
  await db.execute("UPDATE users SET is_verified = TRUE WHERE id = ?", [
    userId,
  ]);
}

async function updateUserPasswordHash(userId, passwordHash) {
  await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", [
    passwordHash,
    userId,
  ]);
}

async function createEmailVerificationToken({ userId, tokenHash, expiresAt }) {
  await db.execute(
    "INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, tokenHash, expiresAt],
  );
}

async function findValidEmailVerificationToken(tokenHash) {
  const [rows] = await db.execute(
    `SELECT * FROM email_verification_tokens
     WHERE token_hash = ?
       AND used_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
  );
  return rows[0] || null;
}

async function markEmailVerificationTokenUsed(id) {
  await db.execute(
    "UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?",
    [id],
  );
}

async function createPasswordResetToken({ userId, tokenHash, expiresAt }) {
  await db.execute(
    "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, tokenHash, expiresAt],
  );
}

async function findValidPasswordResetToken(tokenHash) {
  const [rows] = await db.execute(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = ?
       AND used_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
  );
  return rows[0] || null;
}

async function markPasswordResetTokenUsed(id) {
  await db.execute(
    "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?",
    [id],
  );
}

async function addOutboxEmail({ toEmail, subjectLine, bodyText }) {
  await db.execute(
    "INSERT INTO outbox_emails (to_email, subject_line, body_text) VALUES (?, ?, ?)",
    [toEmail, subjectLine, bodyText],
  );
}

async function getAllOutboxEmails() {
  const [rows] = await db.execute(
    "SELECT * FROM outbox_emails ORDER BY created_at DESC",
  );
  return rows;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  markUserVerified,
  updateUserPasswordHash,
  createEmailVerificationToken,
  findValidEmailVerificationToken,
  markEmailVerificationTokenUsed,
  createPasswordResetToken,
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
  addOutboxEmail,
  getAllOutboxEmails,
};
