"use strict";

const express = require("express");
const requireRole = require("../middleware/requireRole");
const apiDocsController = require("../controllers/apiDocsController");

const router = express.Router();

/*
  API documentation is part of the developer area.
*/
router.get("/api-docs", requireRole("developer"), apiDocsController.showApiDocsPage);

module.exports = router;