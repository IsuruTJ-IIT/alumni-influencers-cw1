"use strict";

const apiTokenDao = require("../dao/apiTokenDao");
const { generatePlainToken, hashToken } = require("../services/tokenService");

async function renderTokenPage(req, res, options = {}) {
  const userId = req.session.user.id;

  const tokens = await apiTokenDao.getTokensWithUsageSummaryByUser(userId);
  const usageLogs = await apiTokenDao.getUsageLogsByUser(userId);

  res.render("developer/tokens", {
    success: options.success || null,
    error: options.error || null,
    newTokenPlaintext: options.newTokenPlaintext || null,
    tokens,
    usageLogs,
  });
}

async function showTokenPage(req, res) {
  const success = req.query.success ? String(req.query.success) : null;
  await renderTokenPage(req, res, { success });
}

async function createToken(req, res) {
  try {
    const userId = req.session.user.id;
    const tokenName = String(req.body.token_name || "").trim();
    const clientType = String(req.body.client_type || "mobile_ar_app").trim();
    const expiresInDaysRaw = String(req.body.expires_in_days || "").trim();

    if (!tokenName) {
      return renderTokenPage(req, res, {
        error: "Token name is required.",
      });
    }

    let expiresAt = null;

    if (expiresInDaysRaw) {
      const expiresInDays = Number(expiresInDaysRaw);

      if (Number.isNaN(expiresInDays) || expiresInDays <= 0) {
        return renderTokenPage(req, res, {
          error: "Expiry days must be a positive number.",
        });
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiresInDays);
      expiresAt = expiryDate;
    }

    const plainToken = generatePlainToken();
    const tokenHash = hashToken(plainToken);

    let scopeName = "read:alumni_of_day";

    if (clientType === "analytics_dashboard") {
      scopeName = "read:alumni read:analytics";
    }

    if (clientType === "mobile_ar_app") {
      scopeName = "read:alumni_of_day";
    }

    await apiTokenDao.createApiToken({
      developerUserId: userId,
      tokenName,
      tokenHash,
      scopeName,
      clientType,
      expiresAt,
    });

    return renderTokenPage(req, res, {
      success:
        "Token created successfully. Copy it now because it will only be shown once.",
      newTokenPlaintext: plainToken,
    });
  } catch (error) {
    console.error(error);
    return renderTokenPage(req, res, {
      error: "Failed to create token.",
    });
  }
}

async function revokeToken(req, res) {
  try {
    const userId = req.session.user.id;
    const tokenId = req.params.id;

    await apiTokenDao.revokeToken(userId, tokenId);

    return res.redirect(
      "/developer/tokens?success=" +
        encodeURIComponent("Token revoked successfully."),
    );
  } catch (error) {
    console.error(error);
    return renderTokenPage(req, res, {
      error: "Failed to revoke token.",
    });
  }
}

module.exports = {
  showTokenPage,
  createToken,
  revokeToken,
};
