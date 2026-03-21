"use strict";

const express = require("express");
const authController = require("../controllers/authController");
const requireLogin = require("../middleware/requireLogin");
const requireGuest = require("../middleware/requireGuest");

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

router.get("/outbox", authController.showOutbox);

module.exports = router;
