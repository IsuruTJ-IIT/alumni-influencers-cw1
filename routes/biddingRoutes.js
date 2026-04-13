"use strict";

const express = require("express");
const requireRole = require("../middleware/requireRole");
const biddingController = require("../controllers/biddingController");

const router = express.Router();

/*
  Only alumni can place, increase, cancel, and view their own bids.
*/
router.use("/bidding", requireRole("alumnus"));

router.get("/bidding", biddingController.showBiddingPage);

router.post("/bidding", biddingController.placeBid);

router.post("/bidding/:id/increase", biddingController.increaseBid);

router.post("/bidding/:id/cancel", biddingController.cancelBid);

module.exports = router;