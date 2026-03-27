"use strict";

const express = require("express");
const bearerAuth = require("../middleware/bearerAuth");
const publicApiController = require("../controllers/publicApiController");

const router = express.Router();

router.get(
  "/api/v1/featured-alumnus",
  bearerAuth,
  publicApiController.getFeaturedAlumnus,
);

module.exports = router;
