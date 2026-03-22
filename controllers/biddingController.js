"use strict";

const biddingDao = require("../dao/biddingDao");
const biddingService = require("../services/biddingService");

function toDateOnly(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toISOString().split("T")[0];
}

function toDateTimeText(value) {
  if (!value) return "";
  return String(value);
}

async function renderBiddingPage(req, res, options = {}) {
  const userId = req.session.user.id;
  const todayDate = biddingService.formatDateLocal(new Date());
  const tomorrowDate = biddingService.getTomorrowDateString(new Date());

  const monthlyStatus = await biddingService.getMonthlyStatus(
    userId,
    tomorrowDate,
  );
  const biddingOpen = biddingService.isBiddingOpenNow(new Date());
  const currentBid = await biddingDao.getActiveBidByUserAndSlot(
    userId,
    tomorrowDate,
  );
  const blindStatus = currentBid
    ? await biddingService.getBlindStatusForUser(userId, tomorrowDate)
    : null;

  const bidHistoryRaw = await biddingDao.getUserBidHistory(userId);
  const bidHistory = bidHistoryRaw.map((item) => ({
    ...item,
    slot_date_text: toDateOnly(item.slot_date),
    created_at_text: toDateTimeText(item.created_at),
    updated_at_text: toDateTimeText(item.updated_at),
  }));

  const todayFeatured = await biddingDao.getFeaturedSlotSummary(todayDate);
  const tomorrowSelected =
    await biddingDao.getFeaturedSlotSummary(tomorrowDate);

  res.render("bidding/index", {
    success: options.success || null,
    error: options.error || null,
    todayDate,
    tomorrowDate,
    biddingOpen,
    currentBid,
    blindStatus,
    bidHistory,
    monthlyStatus,
    todayFeatured,
    tomorrowSelected,
  });
}

function redirectSuccess(res, message) {
  res.redirect(`/bidding?success=${encodeURIComponent(message)}`);
}

async function showBiddingPage(req, res) {
  const success = req.query.success ? String(req.query.success) : null;
  await renderBiddingPage(req, res, { success });
}

async function placeBid(req, res) {
  try {
    const userId = req.session.user.id;
    const tomorrowDate = biddingService.getTomorrowDateString(new Date());
    const bidAmount = Number(req.body.bid_amount);

    if (!biddingService.isBiddingOpenNow(new Date())) {
      return renderBiddingPage(req, res, {
        error: "Bidding is closed for today. Cutoff is 6 PM.",
      });
    }

    if (Number.isNaN(bidAmount) || bidAmount <= 0) {
      return renderBiddingPage(req, res, {
        error: "Bid amount must be a positive number.",
      });
    }

    const monthlyStatus = await biddingService.getMonthlyStatus(
      userId,
      tomorrowDate,
    );
    if (monthlyStatus.wins >= monthlyStatus.allowedWins) {
      return renderBiddingPage(req, res, {
        error: "You have reached your monthly appearance limit.",
      });
    }

    const existingBid = await biddingDao.getActiveBidByUserAndSlot(
      userId,
      tomorrowDate,
    );
    if (existingBid) {
      return renderBiddingPage(req, res, {
        error:
          "You already have an active bid for tomorrow. Use increase instead.",
      });
    }

    await biddingDao.createBid(userId, tomorrowDate, bidAmount);

    return redirectSuccess(res, "Bid placed successfully.");
  } catch (error) {
    console.error(error);
    return renderBiddingPage(req, res, { error: "Failed to place bid." });
  }
}

async function increaseBid(req, res) {
  try {
    const userId = req.session.user.id;
    const tomorrowDate = biddingService.getTomorrowDateString(new Date());
    const newAmount = Number(req.body.new_bid_amount);
    const currentBid = await biddingDao.getActiveBidByUserAndSlot(
      userId,
      tomorrowDate,
    );

    if (!biddingService.isBiddingOpenNow(new Date())) {
      return renderBiddingPage(req, res, {
        error: "Bidding is closed for today. Cutoff is 6 PM.",
      });
    }

    if (!currentBid || String(currentBid.id) !== String(req.params.id)) {
      return renderBiddingPage(req, res, { error: "Active bid not found." });
    }

    if (Number.isNaN(newAmount) || newAmount <= 0) {
      return renderBiddingPage(req, res, {
        error: "New bid amount must be a positive number.",
      });
    }

    if (newAmount <= Number(currentBid.bid_amount)) {
      return renderBiddingPage(req, res, {
        error: "New bid amount must be greater than your current bid.",
      });
    }

    const monthlyStatus = await biddingService.getMonthlyStatus(
      userId,
      tomorrowDate,
    );
    if (monthlyStatus.wins >= monthlyStatus.allowedWins) {
      return renderBiddingPage(req, res, {
        error: "You have reached your monthly appearance limit.",
      });
    }

    await biddingDao.increaseBid(userId, currentBid.id, newAmount);

    return redirectSuccess(res, "Bid increased successfully.");
  } catch (error) {
    console.error(error);
    return renderBiddingPage(req, res, { error: "Failed to increase bid." });
  }
}

async function cancelBid(req, res) {
  try {
    const userId = req.session.user.id;
    const tomorrowDate = biddingService.getTomorrowDateString(new Date());
    const currentBid = await biddingDao.getActiveBidByUserAndSlot(
      userId,
      tomorrowDate,
    );

    if (!biddingService.isBiddingOpenNow(new Date())) {
      return renderBiddingPage(req, res, {
        error: "Bidding is closed for today. Cutoff is 6 PM.",
      });
    }

    if (!currentBid || String(currentBid.id) !== String(req.params.id)) {
      return renderBiddingPage(req, res, { error: "Active bid not found." });
    }

    await biddingDao.cancelBid(userId, currentBid.id);

    return redirectSuccess(res, "Bid cancelled successfully.");
  } catch (error) {
    console.error(error);
    return renderBiddingPage(req, res, { error: "Failed to cancel bid." });
  }
}

async function addEventBonus(req, res) {
  try {
    const userId = req.session.user.id;
    const tomorrowDate = biddingService.getTomorrowDateString(new Date());
    const monthKey = biddingService.getMonthKey(tomorrowDate);

    await biddingDao.addEventBonusIfMissing(userId, monthKey);

    return redirectSuccess(res, "Event bonus added for this month.");
  } catch (error) {
    console.error(error);
    return renderBiddingPage(req, res, { error: "Failed to add event bonus." });
  }
}

async function demoSelectTomorrowWinner(req, res) {
  try {
    await biddingService.forceSelectTomorrowWinnerNow();
    return redirectSuccess(
      res,
      "Local demo helper: tomorrow winner selected now.",
    );
  } catch (error) {
    console.error(error);
    return renderBiddingPage(req, res, {
      error: "Failed to run demo winner selection.",
    });
  }
}

async function demoActivateToday(req, res) {
  try {
    await biddingService.forceActivateTodayNow();
    return redirectSuccess(
      res,
      "Local demo helper: today featured alumnus activated now.",
    );
  } catch (error) {
    console.error(error);
    return renderBiddingPage(req, res, {
      error: "Failed to run demo activation.",
    });
  }
}

module.exports = {
  showBiddingPage,
  placeBid,
  increaseBid,
  cancelBid,
  addEventBonus,
  demoSelectTomorrowWinner,
  demoActivateToday,
};
