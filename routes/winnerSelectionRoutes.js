"use strict";

const express = require("express");
const requireLogin = require("../middleware/requireLogin");
const winnerSelectionController = require("../controllers/winnerSelectionController");

const router = express.Router();

router.get(
  "/winner-selection",
  requireLogin,
  winnerSelectionController.showWinnerSelectionPage,
);

router.post(
  "/winner-selection/demo-select",
  requireLogin,
  winnerSelectionController.demoSelectTomorrowWinner,
);
router.post(
  "/winner-selection/demo-activate",
  requireLogin,
  winnerSelectionController.demoActivateToday,
);
router.post(
  "/winner-selection/run-cycle",
  requireLogin,
  winnerSelectionController.runFullCycleNow,
);

module.exports = router;
