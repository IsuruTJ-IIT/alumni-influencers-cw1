"use strict";

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function isUniversityEmail(email) {
  const normalized = normalizeEmail(email);
  const domain = String(
    process.env.UNIVERSITY_EMAIL_DOMAIN || "eastminster.ac.uk",
  )
    .trim()
    .toLowerCase();

  return normalized.endsWith(`@${domain}`);
}

function isStrongPassword(password) {
  const value = String(password || "");

  if (value.length < 8) return false;
  if (!/[A-Z]/.test(value)) return false;
  if (!/[a-z]/.test(value)) return false;
  if (!/[0-9]/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;

  return true;
}

function isNonEmptyText(value) {
  return String(value || "").trim() !== "";
}

module.exports = {
  normalizeEmail,
  isUniversityEmail,
  isStrongPassword,
  isNonEmptyText,
};
