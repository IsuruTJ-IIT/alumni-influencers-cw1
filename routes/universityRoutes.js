"use strict";

const express = require("express");
const requireRole = require("../middleware/requireRole");
const universityController = require("../controllers/universityController");

const router = express.Router();

/*
  Only university users can view the analytics client pages.
*/
router.get(
  "/university/dashboard",
  requireRole("university"),
  universityController.showDashboard,
);

router.get(
  "/university/alumni",
  requireRole("university"),
  universityController.showAlumniPage,
);

module.exports = router;