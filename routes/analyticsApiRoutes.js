"use strict";

const express = require("express");
const bearerAuth = require("../middleware/bearerAuth");
const requireApiScope = require("../middleware/requireApiScope");
const analyticsApiController = require("../controllers/analyticsApiController");

const router = express.Router();

router.get(
  "/api/v1/analytics/filter-options",
  bearerAuth,
  requireApiScope("read:analytics"),
  analyticsApiController.getFilterOptions
);

router.get(
  "/api/v1/analytics/dashboard-data",
  bearerAuth,
  requireApiScope("read:analytics"),
  analyticsApiController.getDashboardData
);

router.get(
  "/api/v1/alumni",
  bearerAuth,
  requireApiScope("read:alumni"),
  analyticsApiController.getAlumni
);

module.exports = router;