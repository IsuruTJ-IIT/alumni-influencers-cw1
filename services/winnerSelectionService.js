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

function getMonthKey(slotDate) {
  return String(slotDate).slice(0, 7);
}

function getMonthRange(slotDate) {
  const year = Number(String(slotDate).slice(0, 4));
  const month = Number(String(slotDate).slice(5, 7));

  const start = `${year}-${pad(month)}-01`;
  const lastDayDate = new Date(year, month, 0);
  const end = formatDateLocal(lastDayDate);

  return { start, end };
}

function isAfterSixPm(baseDate = new Date()) {
  return baseDate.getHours() >= 18;
}

async function getAllowedWinsForUser(userId, slotDate) {
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

async function getLeadingEligibleBidForSlot(slotDate) {
  const allActiveBids = await biddingDao.getAllActiveBidsForSlot(slotDate);

  for (const bid of allActiveBids) {
    const monthlyStatus = await getAllowedWinsForUser(bid.user_id, slotDate);

    if (monthlyStatus.wins < monthlyStatus.allowedWins) {
      return {
        bid,
        monthlyStatus,
      };
    }
  }

  return null;
}

async function selectTomorrowWinnerIfDue(baseDate = new Date()) {
  const todayKey = formatDateLocal(baseDate);

  if (!isAfterSixPm(baseDate)) {
    return {
      ran: false,
      reason:
        "It is not yet 6 PM, so tomorrow winner selection has not started.",
    };
  }

  const alreadyRan = await biddingDao.hasJobRun("select_winner", todayKey);
  if (alreadyRan) {
    return {
      ran: false,
      reason: "Tomorrow winner selection already ran today.",
    };
  }

  const tomorrowSlot = getTomorrowDateString(baseDate);
  const leading = await getLeadingEligibleBidForSlot(tomorrowSlot);

  await biddingDao.markAllActiveBidsAsLost(tomorrowSlot);

  if (leading && leading.bid) {
    await biddingDao.markBidAsWon(leading.bid.id);
    await biddingDao.saveSelectedWinner(
      tomorrowSlot,
      leading.bid.id,
      leading.bid.user_id,
      new Date(),
    );
  } else {
    await biddingDao.saveSelectedWinner(tomorrowSlot, null, null, new Date());
  }

  await biddingDao.recordJobRun("select_winner", todayKey);

  return {
    ran: true,
    slotDate: tomorrowSlot,
    winner: leading ? leading.bid : null,
  };
}

async function activateTodayIfDue(baseDate = new Date()) {
  const todayKey = formatDateLocal(baseDate);

  const alreadyRan = await biddingDao.hasJobRun("activate_featured", todayKey);
  if (alreadyRan) {
    return {
      ran: false,
      reason: "Today activation already ran.",
    };
  }

  const slot = await biddingDao.getFeaturedSlotSummary(todayKey);

  if (!slot || !slot.featured_user_id) {
    return {
      ran: false,
      reason: "There is no selected featured alumnus for today.",
    };
  }

  await biddingDao.activateFeaturedSlot(todayKey, new Date());
  await biddingDao.recordJobRun("activate_featured", todayKey);

  return {
    ran: true,
    slotDate: todayKey,
    winner: slot,
  };
}

async function runWinnerSelectionCycle(baseDate = new Date()) {
  const activationResult = await activateTodayIfDue(baseDate);
  const selectionResult = await selectTomorrowWinnerIfDue(baseDate);

  return {
    activationResult,
    selectionResult,
  };
}

function startWinnerSelectionScheduler() {
  runWinnerSelectionCycle(new Date()).catch(console.error);

  setInterval(() => {
    runWinnerSelectionCycle(new Date()).catch(console.error);
  }, 60 * 1000);
}

async function forceSelectTomorrowWinnerNow() {
  const tomorrowSlot = getTomorrowDateString(new Date());
  const leading = await getLeadingEligibleBidForSlot(tomorrowSlot);

  await biddingDao.markAllActiveBidsAsLost(tomorrowSlot);

  if (leading && leading.bid) {
    await biddingDao.markBidAsWon(leading.bid.id);
    await biddingDao.saveSelectedWinner(
      tomorrowSlot,
      leading.bid.id,
      leading.bid.user_id,
      new Date(),
    );
  } else {
    await biddingDao.saveSelectedWinner(tomorrowSlot, null, null, new Date());
  }

  return {
    slotDate: tomorrowSlot,
    winner: leading ? leading.bid : null,
  };
}

async function forceActivateTodayNow() {
  const todaySlot = formatDateLocal(new Date());
  const slot = await biddingDao.getFeaturedSlotSummary(todaySlot);

  if (slot && slot.featured_user_id) {
    await biddingDao.activateFeaturedSlot(todaySlot, new Date());
  }

  return {
    slotDate: todaySlot,
    winner: slot || null,
  };
}

async function getWinnerSelectionDashboardData() {
  const todaySlot = formatDateLocal(new Date());
  const tomorrowSlot = getTomorrowDateString(new Date());

  const todayFeatured = await biddingDao.getFeaturedSlotSummary(todaySlot);
  const tomorrowFeatured =
    await biddingDao.getFeaturedSlotSummary(tomorrowSlot);
  const leading = await getLeadingEligibleBidForSlot(tomorrowSlot);

  const todaySelectionRan = await biddingDao.hasJobRun(
    "select_winner",
    todaySlot,
  );
  const todayActivationRan = await biddingDao.hasJobRun(
    "activate_featured",
    todaySlot,
  );

  return {
    todaySlot,
    tomorrowSlot,
    todayFeatured,
    tomorrowFeatured,
    leadingBid: leading ? leading.bid : null,
    todaySelectionRan,
    todayActivationRan,
    afterSixPmNow: isAfterSixPm(new Date()),
  };
}

module.exports = {
  formatDateLocal,
  getTomorrowDateString,
  getAllowedWinsForUser,
  getLeadingEligibleBidForSlot,
  selectTomorrowWinnerIfDue,
  activateTodayIfDue,
  runWinnerSelectionCycle,
  startWinnerSelectionScheduler,
  forceSelectTomorrowWinnerNow,
  forceActivateTodayNow,
  getWinnerSelectionDashboardData,
};
