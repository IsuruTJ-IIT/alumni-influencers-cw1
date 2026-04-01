"use strict";

async function showApiDocsPage(req, res) {
  res.render("developer/api-docs");
}

module.exports = {
  showApiDocsPage,
};
