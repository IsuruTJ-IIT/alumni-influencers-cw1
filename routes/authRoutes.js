"use strict";

const express = require("express");
const authController = require("../controllers/authController");
const requireLogin = require("../middleware/requireLogin");
const requireGuest = require("../middleware/requireGuest");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.get("/register", requireGuest, authController.showRegisterPage);
router.post("/register", requireGuest, authController.register);

router.get("/verify-email", authController.verifyEmail);

router.get("/login", requireGuest, authController.showLoginPage);
router.post("/login", requireGuest, authController.login);

router.post("/logout", requireLogin, authController.logout);

router.get(
  "/forgot-password",
  requireGuest,
  authController.showForgotPasswordPage,
);

router.post("/forgot-password", requireGuest, authController.forgotPassword);

router.get(
  "/reset-password",
  requireGuest,
  authController.showResetPasswordPage,
);

router.post("/reset-password", requireGuest, authController.resetPassword);

router.get("/dashboard", requireLogin, authController.showDashboard);

/*
  Local outbox contains verification and password-reset links.
  It must not be public because anyone could steal reset links.
  For coursework demo, only the developer account can inspect it.
*/
router.get("/outbox", requireRole("developer"), authController.showOutbox);

module.exports = router;