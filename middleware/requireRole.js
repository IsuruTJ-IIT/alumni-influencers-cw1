"use strict";

function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      return res
        .status(403)
        .send("Access denied. You do not have permission to view this page.");
    }

    next();
  };
}

module.exports = requireRole;