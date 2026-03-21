"use strict";

const crypto = require("crypto");

function generatePlainToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function getFutureDate(hoursFromNow) {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  return date;
}

module.exports = {
  generatePlainToken,
  hashToken,
  getFutureDate,
};
