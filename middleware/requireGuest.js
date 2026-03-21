"use strict";

function requireGuest(req, res, next) {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  next();
}

module.exports = requireGuest;
