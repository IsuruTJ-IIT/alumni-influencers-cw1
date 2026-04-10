"use strict";

function requireApiScope(requiredScope) {
  return function (req, res, next) {
    const scopeText = String(
      req.apiToken && req.apiToken.scope_name ? req.apiToken.scope_name : ""
    );

    const scopes = scopeText
      .split(/[ ,]+/)
      .map((scope) => scope.trim())
      .filter(Boolean);

    if (!scopes.includes(requiredScope)) {
      return res.status(403).json({
        success: false,
        message:
          "This API key does not have the required permission: " +
          requiredScope,
      });
    }

    next();
  };
}

module.exports = requireApiScope;