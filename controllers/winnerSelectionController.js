"use strict";

const winnerSelectionService = require("../services/winnerSelectionService");
const biddingDao = require("../dao/biddingDao");
const biddingService = require("../services/biddingService");

async function renderWinnerSelectionPage(req, res, options = {}) {
  const dashboardData =
    await winnerSelectionService.getWinnerSelectionDashboardData();

  res.render("winner-selection/index", {
    success: options.success || null,
    error: options.error || null,
    ...dashboardData,
  });
}

async function showWinnerSelectionPage(req, res) {
  const success = req.query.success ? String(req.query.success) : null;
  await renderWinnerSelectionPage(req, res, { success });
}

async function demoSelectTomorrowWinner(req, res) {
  try {
    await winnerSelectionService.forceSelectTomorrowWinnerNow();
    res.redirect(
      "/winner-selection?success=" +
        encodeURIComponent("Local demo: tomorrow winner selected now."),
    );
  } catch (error) {
    console.error(error);
    await renderWinnerSelectionPage(req, res, {
      error: "Failed to run local demo selection.",
    });
  }
}

async function demoActivateToday(req, res) {
  try {
    await winnerSelectionService.forceActivateTodayNow();
    res.redirect(
      "/winner-selection?success=" +
        encodeURIComponent("Local demo: today featured alumnus activated now."),
    );
  } catch (error) {
    console.error(error);
    await renderWinnerSelectionPage(req, res, {
      error: "Failed to run local demo activation.",
    });
  }
}

async function runFullCycleNow(req, res) {
  try {
    await winnerSelectionService.runWinnerSelectionCycle(new Date());
    res.redirect(
      "/winner-selection?success=" +
        encodeURIComponent("Full winner-selection cycle ran now."),
    );
  } catch (error) {
    console.error(error);
    await renderWinnerSelectionPage(req, res, {
      error: "Failed to run full winner-selection cycle.",
    });
  }
}

async function grantEventBonus(req, res) {
  try {
    const alumnusUserId = Number(req.body.alumnus_user_id);
    const eventMonth = String(req.body.event_month || "").trim();

    if (!Number.isInteger(alumnusUserId) || alumnusUserId <= 0) {
      await renderWinnerSelectionPage(req, res, {
        error: "Enter a valid alumnus user ID.",
      });
      return;
    }

    if (!/^\d{4}-\d{2}$/.test(eventMonth)) {
      await renderWinnerSelectionPage(req, res, {
        error: "Enter event month in YYYY-MM format, for example 2026-04.",
      });
      return;
    }

    await biddingDao.addEventBonusIfMissing(alumnusUserId, eventMonth);

    res.redirect(
      "/winner-selection?success=" +
        encodeURIComponent("Event bonus granted to alumnus user ID " + alumnusUserId + "."),
    );
  } catch (error) {
    console.error(error);
    await renderWinnerSelectionPage(req, res, {
      error: "Failed to grant event bonus.",
    });
  }
}

module.exports = {
  showWinnerSelectionPage,
  demoSelectTomorrowWinner,
  demoActivateToday,
  runFullCycleNow,
  grantEventBonus,
};
