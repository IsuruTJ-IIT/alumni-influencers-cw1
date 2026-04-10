"use strict";

const analyticsDao = require("../dao/analyticsDao");

function getFiltersFromRequest(req) {
  return {
    programme: req.query.programme,
    graduationYear: req.query.graduation_year,
    industrySector: req.query.industry_sector,
  };
}

async function getFilterOptions(req, res) {
  try {
    const data = await analyticsDao.getFilterOptions();
    return res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load filter options.",
    });
  }
}

async function getAlumni(req, res) {
  try {
    const data = await analyticsDao.getAlumniList(getFiltersFromRequest(req));
    return res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load alumni.",
    });
  }
}

async function getDashboardData(req, res) {
  try {
    const data = await analyticsDao.getDashboardData(getFiltersFromRequest(req));
    return res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load analytics data.",
    });
  }
}

module.exports = {
  getFilterOptions,
  getAlumni,
  getDashboardData,
};