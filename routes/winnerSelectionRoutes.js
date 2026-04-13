"use strict";

const express = require("express");
const requireRole = require("../middleware/requireRole");
const winnerSelectionController = require("../controllers/winnerSelectionController");

const router = express.Router();

/*
  Winner selection is a system/developer action.
  Alumni and university users must not manually select or activate winners.
*/
router.use("/winner-selection", requireRole("developer"));

router.get(
  "/winner-selection",
  winnerSelectionController.showWinnerSelectionPage,
);

router.post(
  "/winner-selection/demo-select",
  winnerSelectionController.demoSelectTomorrowWinner,
);

router.post(
  "/winner-selection/demo-activate",
  winnerSelectionController.demoActivateToday,
);

router.post(
  "/winner-selection/run-cycle",
  winnerSelectionController.runFullCycleNow,
);

router.post(
  "/winner-selection/event-bonus",
  winnerSelectionController.grantEventBonus,
);

module.exports = router;