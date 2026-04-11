"use strict";

async function showDashboard(req, res) {
  res.render("university/dashboard");
}

async function showAlumniPage(req, res) {
  res.render("university/alumni");
}

module.exports = {
  showDashboard,
  showAlumniPage,
};