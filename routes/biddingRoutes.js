"use strict";

const express = require("express");
const requireLogin = require("../middleware/requireLogin");
const biddingController = require("../controllers/biddingController");

const router = express.Router();

router.get("/bidding", requireLogin, biddingController.showBiddingPage);

router.post("/bidding", requireLogin, biddingController.placeBid);
router.post(
  "/bidding/:id/increase",
  requireLogin,
  biddingController.increaseBid,
);
router.post("/bidding/:id/cancel", requireLogin, biddingController.cancelBid);

router.post(
  "/bidding/event-bonus",
  requireLogin,
  biddingController.addEventBonus,
);

router.post(
  "/bidding/demo-select-winner",
  requireLogin,
  biddingController.demoSelectTomorrowWinner,
);
router.post(
  "/bidding/demo-activate-today",
  requireLogin,
  biddingController.demoActivateToday,
);

module.exports = router;
