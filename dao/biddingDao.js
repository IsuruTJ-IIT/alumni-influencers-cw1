"use strict";

const db = require("../config/database");

async function getActiveBidByUserAndSlot(userId, slotDate) {
  const [rows] = await db.execute(
    `SELECT * FROM bids
     WHERE user_id = ? AND slot_date = ? AND status = 'active'
     LIMIT 1`,
    [userId, slotDate],
  );
  return rows[0] || null;
}

async function createBid(userId, slotDate, bidAmount) {
  await db.execute(
    `INSERT INTO bids (user_id, slot_date, bid_amount, status)
     VALUES (?, ?, ?, 'active')`,
    [userId, slotDate, bidAmount],
  );
}

async function increaseBid(userId, bidId, newAmount) {
  await db.execute(
    `UPDATE bids
     SET bid_amount = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ? AND status = 'active'`,
    [newAmount, bidId, userId],
  );
}

async function cancelBid(userId, bidId) {
  await db.execute(
    `UPDATE bids
     SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ? AND status = 'active'`,
    [bidId, userId],
  );
}

async function getUserBidHistory(userId) {
  const [rows] = await db.execute(
    `SELECT * FROM bids
     WHERE user_id = ?
     ORDER BY slot_date DESC, created_at DESC`,
    [userId],
  );
  return rows;
}

async function getAllActiveBidsForSlot(slotDate) {
  const [rows] = await db.execute(
    `SELECT * FROM bids
     WHERE slot_date = ? AND status = 'active'
     ORDER BY bid_amount DESC, created_at ASC`,
    [slotDate],
  );
  return rows;
}

async function markAllActiveBidsAsLost(slotDate) {
  await db.execute(
    `UPDATE bids
     SET status = 'lost', updated_at = CURRENT_TIMESTAMP
     WHERE slot_date = ? AND status = 'active'`,
    [slotDate],
  );
}

async function markBidAsWon(bidId) {
  await db.execute(
    `UPDATE bids
     SET status = 'won', updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [bidId],
  );
}

async function saveSelectedWinner(
  slotDate,
  winningBidId,
  featuredUserId,
  selectedAt,
) {
  await db.execute(
    `INSERT INTO featured_slots (slot_date, winning_bid_id, featured_user_id, selected_at)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       winning_bid_id = VALUES(winning_bid_id),
       featured_user_id = VALUES(featured_user_id),
       selected_at = VALUES(selected_at)`,
    [slotDate, winningBidId, featuredUserId, selectedAt],
  );
}

async function activateFeaturedSlot(slotDate, activatedAt) {
  await db.execute(
    `UPDATE featured_slots
     SET activated_at = ?
     WHERE slot_date = ?`,
    [activatedAt, slotDate],
  );
}

async function getFeaturedSlotSummary(slotDate) {
  const [rows] = await db.execute(
    `SELECT fs.*, u.full_name
     FROM featured_slots fs
     LEFT JOIN users u ON fs.featured_user_id = u.id
     WHERE fs.slot_date = ?
     LIMIT 1`,
    [slotDate],
  );
  return rows[0] || null;
}

async function getWinsCountForMonth(userId, monthStart, monthEnd) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM featured_slots
     WHERE featured_user_id = ?
       AND activated_at IS NOT NULL
       AND slot_date BETWEEN ? AND ?`,
    [userId, monthStart, monthEnd],
  );
  return rows[0].total || 0;
}

async function hasEventBonus(userId, eventMonth) {
  const [rows] = await db.execute(
    `SELECT * FROM alumni_event_participation
     WHERE user_id = ? AND event_month = ?
     LIMIT 1`,
    [userId, eventMonth],
  );
  return !!rows[0];
}

async function addEventBonusIfMissing(userId, eventMonth) {
  const exists = await hasEventBonus(userId, eventMonth);

  if (!exists) {
    await db.execute(
      `INSERT INTO alumni_event_participation (user_id, event_month)
       VALUES (?, ?)`,
      [userId, eventMonth],
    );
  }
}

async function hasJobRun(jobName, runDate) {
  const [rows] = await db.execute(
    `SELECT * FROM job_runs
     WHERE job_name = ? AND run_date = ?
     LIMIT 1`,
    [jobName, runDate],
  );
  return !!rows[0];
}

async function recordJobRun(jobName, runDate) {
  await db.execute(
    `INSERT INTO job_runs (job_name, run_date)
     VALUES (?, ?)`,
    [jobName, runDate],
  );
}

module.exports = {
  getActiveBidByUserAndSlot,
  createBid,
  increaseBid,
  cancelBid,
  getUserBidHistory,
  getAllActiveBidsForSlot,
  markAllActiveBidsAsLost,
  markBidAsWon,
  saveSelectedWinner,
  activateFeaturedSlot,
  getFeaturedSlotSummary,
  getWinsCountForMonth,
  hasEventBonus,
  addEventBonusIfMissing,
  hasJobRun,
  recordJobRun,
};
