"use strict";

const express = require("express");
const apiDocsController = require("../controllers/apiDocsController");

const router = express.Router();

router.get("/api-docs", apiDocsController.showApiDocsPage);

module.exports = router;
