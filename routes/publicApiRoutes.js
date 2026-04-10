"use strict";

const express = require("express");
const bearerAuth = require("../middleware/bearerAuth");
const requireApiScope = require("../middleware/requireApiScope");
const publicApiController = require("../controllers/publicApiController");

const router = express.Router();

router.get(
  "/api/v1/featured-alumnus",
  bearerAuth,
  requireApiScope("read:alumni_of_day"),
  publicApiController.getFeaturedAlumnus
);

module.exports = router;