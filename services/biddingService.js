"use strict";

const biddingDao = require("../dao/biddingDao");

function pad(number) {
  return String(number).padStart(2, "0");
}

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}

function getTomorrowDateString(baseDate = new Date()) {
  const tomorrow = new Date(baseDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateLocal(tomorrow);
}

function getMonthKey(dateString) {
  return String(dateString).slice(0, 7);
}

function getMonthRange(dateString) {
  const year = Number(dateString.slice(0, 4));
  const month = Number(dateString.slice(5, 7));

  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0);
  const end = formatDateLocal(lastDay);

  return { start, end };
}

function isBiddingOpenNow(baseDate = new Date()) {
  return baseDate.getHours() < 18;
}

async function getMonthlyStatus(userId, slotDate) {
  const monthKey = getMonthKey(slotDate);
  const range = getMonthRange(slotDate);
  const wins = await biddingDao.getWinsCountForMonth(
    userId,
    range.start,
    range.end,
  );
  const hasBonus = await biddingDao.hasEventBonus(userId, monthKey);
  const allowedWins = hasBonus ? 4 : 3;

  return {
    wins,
    hasBonus,
    allowedWins,
    remaining: Math.max(allowedWins - wins, 0),
  };
}

async function getLeadingEligibleBid(slotDate) {
  const bids = await biddingDao.getAllActiveBidsForSlot(slotDate);

  for (const bid of bids) {
    const monthlyStatus = await getMonthlyStatus(bid.user_id, slotDate);

    if (monthlyStatus.wins < monthlyStatus.allowedWins) {
      return bid;
    }
  }

  return null;
}

async function getBlindStatusForUser(userId, slotDate) {
  const currentBid = await biddingDao.getActiveBidByUserAndSlot(
    userId,
    slotDate,
  );

  if (!currentBid) {
    return null;
  }

  const leader = await getLeadingEligibleBid(slotDate);

  if (!leader) {
    return "No eligible leading bid yet";
  }

  return leader.id === currentBid.id ? "winning" : "losing";
}

async function selectTomorrowWinnerIfDue(baseDate = new Date()) {
  const todayKey = formatDateLocal(baseDate);

  if (
    !isBiddingOpenNow(baseDate) &&
    !(await biddingDao.hasJobRun("select_winner", todayKey))
  ) {
    const tomorrowSlot = getTomorrowDateString(baseDate);
    const winner = await getLeadingEligibleBid(tomorrowSlot);

    await biddingDao.markAllActiveBidsAsLost(tomorrowSlot);

    if (winner) {
      await biddingDao.markBidAsWon(winner.id);
      await biddingDao.saveSelectedWinner(
        tomorrowSlot,
        winner.id,
        winner.user_id,
        new Date(),
      );
    } else {
      await biddingDao.saveSelectedWinner(tomorrowSlot, null, null, new Date());
    }

    await biddingDao.recordJobRun("select_winner", todayKey);

    return { ran: true, slotDate: tomorrowSlot, winner };
  }

  return { ran: false };
}

async function activateTodayFeaturedIfDue(baseDate = new Date()) {
  const todayKey = formatDateLocal(baseDate);

  if (await biddingDao.hasJobRun("activate_featured", todayKey)) {
    return { ran: false };
  }

  const todaySlot = todayKey;
  const slot = await biddingDao.getFeaturedSlotSummary(todaySlot);

  if (!slot || !slot.featured_user_id) {
    return { ran: false };
  }

  await biddingDao.activateFeaturedSlot(todaySlot, new Date());
  await biddingDao.recordJobRun("activate_featured", todayKey);

  return { ran: true, slotDate: todaySlot, winner: slot };
}

async function runSchedulerOnce() {
  await activateTodayFeaturedIfDue(new Date());
  await selectTomorrowWinnerIfDue(new Date());
}

function startBiddingScheduler() {
  runSchedulerOnce().catch(console.error);

  setInterval(() => {
    runSchedulerOnce().catch(console.error);
  }, 60 * 1000);
}

async function forceSelectTomorrowWinnerNow() {
  const tomorrowSlot = getTomorrowDateString(new Date());
  const winner = await getLeadingEligibleBid(tomorrowSlot);

  await biddingDao.markAllActiveBidsAsLost(tomorrowSlot);

  if (winner) {
    await biddingDao.markBidAsWon(winner.id);
    await biddingDao.saveSelectedWinner(
      tomorrowSlot,
      winner.id,
      winner.user_id,
      new Date(),
    );
  } else {
    await biddingDao.saveSelectedWinner(tomorrowSlot, null, null, new Date());
  }

  return { slotDate: tomorrowSlot, winner };
}

async function forceActivateTodayNow() {
  const todaySlot = formatDateLocal(new Date());
  const slot = await biddingDao.getFeaturedSlotSummary(todaySlot);

  if (slot && slot.featured_user_id) {
    await biddingDao.activateFeaturedSlot(todaySlot, new Date());
  }

  return { slotDate: todaySlot, winner: slot };
}

module.exports = {
  formatDateLocal,
  getTomorrowDateString,
  getMonthKey,
  isBiddingOpenNow,
  getMonthlyStatus,
  getLeadingEligibleBid,
  getBlindStatusForUser,
  runSchedulerOnce,
  startBiddingScheduler,
  forceSelectTomorrowWinnerNow,
  forceActivateTodayNow,
};
