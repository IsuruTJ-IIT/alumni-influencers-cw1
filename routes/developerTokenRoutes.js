"use strict";

const express = require("express");
const requireRole = require("../middleware/requireRole");
const developerTokenController = require("../controllers/developerTokenController");

const router = express.Router();

/*
  Only developers can create, view, and revoke API tokens.
  University users consume analytics tokens, but they do not manage the token system.
*/
router.use("/developer", requireRole("developer"));

router.get("/developer/tokens", developerTokenController.showTokenPage);

router.post("/developer/tokens", developerTokenController.createToken);

router.post("/developer/tokens/:id/revoke", developerTokenController.revokeToken);

module.exports = router;