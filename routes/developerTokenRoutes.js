"use strict";

const express = require("express");
const requireLogin = require("../middleware/requireLogin");
const developerTokenController = require("../controllers/developerTokenController");

const router = express.Router();

router.get(
  "/developer/tokens",
  requireLogin,
  developerTokenController.showTokenPage,
);
router.post(
  "/developer/tokens",
  requireLogin,
  developerTokenController.createToken,
);
router.post(
  "/developer/tokens/:id/revoke",
  requireLogin,
  developerTokenController.revokeToken,
);

module.exports = router;
