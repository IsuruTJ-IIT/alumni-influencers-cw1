"use strict";

const bcrypt = require("bcrypt");
const authDao = require("../dao/authDao");
const profileDao = require("../dao/profileDao");
const {
  normalizeEmail,
  isUniversityEmail,
  isStrongPassword,
  isNonEmptyText,
} = require("../utils/validators");
const {
  generatePlainToken,
  hashToken,
  getFutureDate,
} = require("../services/tokenService");

function renderMessage(res, title, message) {
  return res.render("auth/message", { title, message });
}

async function showRegisterPage(req, res) {
  res.render("auth/register", { error: null, formData: {} });
}

async function register(req, res) {
  try {
    const fullName = String(req.body.full_name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirm_password || "");

    const formData = { full_name: fullName, email };

    if (!isNonEmptyText(fullName)) {
      return res.render("auth/register", {
        error: "Full name is required.",
        formData,
      });
    }

    if (!isUniversityEmail(email)) {
      return res.render("auth/register", {
        error: "Email must use the university domain.",
        formData,
      });
    }

    if (!isStrongPassword(password)) {
      return res.render("auth/register", {
        error:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
        formData,
      });
    }

    if (password !== confirmPassword) {
      return res.render("auth/register", {
        error: "Password and confirm password do not match.",
        formData,
      });
    }

    const existingUser = await authDao.findUserByEmail(email);
    if (existingUser) {
      return res.render("auth/register", {
        error: "An account with this email already exists.",
        formData,
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await authDao.createUser({
      fullName,
      email,
      passwordHash,
    });

    const plainToken = generatePlainToken();
    const tokenHash = hashToken(plainToken);
    const expiresAt = getFutureDate(24);

    await authDao.createEmailVerificationToken({
      userId,
      tokenHash,
      expiresAt,
    });

    const verificationLink = `${process.env.APP_BASE_URL}/verify-email?token=${plainToken}`;

    await authDao.addOutboxEmail({
      toEmail: email,
      subjectLine: "Verify your email address",
      bodyText: `Open this link to verify your account:\n\n${verificationLink}`,
    });

    return renderMessage(
      res,
      "Registration successful",
      "Your account was created. For local testing, the developer account can open /outbox and use the verification link.",
    );
  } catch (error) {
    console.error(error);
    return res.render("auth/register", {
      error: "Something went wrong during registration.",
      formData: {},
    });
  }
}

async function verifyEmail(req, res) {
  try {
    const token = String(req.query.token || "").trim();

    if (!token) {
      return renderMessage(
        res,
        "Verification failed",
        "Verification token is missing.",
      );
    }

    const tokenHash = hashToken(token);
    const tokenRow = await authDao.findValidEmailVerificationToken(tokenHash);

    if (!tokenRow) {
      return renderMessage(
        res,
        "Verification failed",
        "Token is invalid, expired, or already used.",
      );
    }

    await authDao.markUserVerified(tokenRow.user_id);
    await authDao.markEmailVerificationTokenUsed(tokenRow.id);

    return renderMessage(
      res,
      "Email verified",
      "Your email has been verified. You can now log in.",
    );
  } catch (error) {
    console.error(error);
    return renderMessage(
      res,
      "Verification failed",
      "Something went wrong while verifying your email.",
    );
  }
}

async function showLoginPage(req, res) {
  res.render("auth/login", { error: null, email: "" });
}

async function login(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    const user = await authDao.findUserByEmail(email);

    if (!user) {
      return res.render("auth/login", {
        error: "Invalid credentials.",
        email,
      });
    }

    if (!user.is_verified) {
      return res.render("auth/login", {
        error: "You must verify your email before logging in.",
        email,
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.render("auth/login", {
        error: "Invalid credentials.",
        email,
      });
    }

    req.session.user = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    };

    return res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    return res.render("auth/login", {
      error: "Something went wrong during login.",
      email: "",
    });
  }
}

async function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/login");
  });
}

async function showForgotPasswordPage(req, res) {
  res.render("auth/forgot-password", { error: null });
}

async function forgotPassword(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await authDao.findUserByEmail(email);

    if (user) {
      const plainToken = generatePlainToken();
      const tokenHash = hashToken(plainToken);
      const expiresAt = getFutureDate(1);

      await authDao.createPasswordResetToken({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      const resetLink = `${process.env.APP_BASE_URL}/reset-password?token=${plainToken}`;

      await authDao.addOutboxEmail({
        toEmail: email,
        subjectLine: "Reset your password",
        bodyText: `Open this link to reset your password:\n\n${resetLink}`,
      });
    }

    return renderMessage(
      res,
      "Password reset",
      "If that email exists, a password reset link was generated. For local testing, the developer account can open /outbox to inspect it.",
    );
  } catch (error) {
    console.error(error);
    return res.render("auth/forgot-password", {
      error: "Something went wrong while creating the reset link.",
    });
  }
}

async function showResetPasswordPage(req, res) {
  const token = String(req.query.token || "").trim();

  if (!token) {
    return renderMessage(res, "Reset failed", "Reset token is missing.");
  }

  res.render("auth/reset-password", {
    error: null,
    token,
  });
}

async function resetPassword(req, res) {
  try {
    const token = String(req.body.token || "").trim();
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirm_password || "");

    if (!token) {
      return renderMessage(res, "Reset failed", "Reset token is missing.");
    }

    if (!isStrongPassword(password)) {
      return res.render("auth/reset-password", {
        error:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
        token,
      });
    }

    if (password !== confirmPassword) {
      return res.render("auth/reset-password", {
        error: "Password and confirm password do not match.",
        token,
      });
    }

    const tokenHash = hashToken(token);
    const tokenRow = await authDao.findValidPasswordResetToken(tokenHash);

    if (!tokenRow) {
      return renderMessage(
        res,
        "Reset failed",
        "Token is invalid, expired, or already used.",
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await authDao.updateUserPasswordHash(tokenRow.user_id, passwordHash);
    await authDao.markPasswordResetTokenUsed(tokenRow.id);

    return renderMessage(
      res,
      "Password reset complete",
      "Your password was updated. You can now log in.",
    );
  } catch (error) {
    console.error(error);
    return renderMessage(
      res,
      "Reset failed",
      "Something went wrong while resetting your password.",
    );
  }
}

async function showDashboard(req, res) {
  let profile = null;
  if (req.session.user && req.session.user.role === 'alumnus') {
    profile = await profileDao.getProfileByUserId(req.session.user.id);
  }
  res.render("auth/dashboard", { profile });
}

async function showOutbox(req, res) {
  const emails = await authDao.getAllOutboxEmails();
  res.render("outbox", { emails });
}

module.exports = {
  showRegisterPage,
  register,
  verifyEmail,
  showLoginPage,
  login,
  logout,
  showForgotPasswordPage,
  forgotPassword,
  showResetPasswordPage,
  resetPassword,
  showDashboard,
  showOutbox,
};
