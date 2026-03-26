"use strict";

const winnerSelectionService = require("../services/winnerSelectionService");

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

module.exports = {
  showWinnerSelectionPage,
  demoSelectTomorrowWinner,
  demoActivateToday,
  runFullCycleNow,
};
