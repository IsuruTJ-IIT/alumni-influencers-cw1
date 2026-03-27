"use strict";

const biddingDao = require("../dao/biddingDao");
const profileDao = require("../dao/profileDao");
const authDao = require("../dao/authDao");
const { formatDateLocal } = require("../services/winnerSelectionService");

async function getFeaturedAlumnus(req, res) {
  try {
    const todayDate = formatDateLocal(new Date());
    const todaySlot = await biddingDao.getFeaturedSlotSummary(todayDate);

    if (!todaySlot || !todaySlot.featured_user_id || !todaySlot.activated_at) {
      return res.status(404).json({
        success: false,
        message: "No featured alumnus is active for today.",
      });
    }

    const user = await authDao.findUserById(todaySlot.featured_user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Featured alumnus user record not found.",
      });
    }

    const profileData = await profileDao.getFullProfileData(user.id);

    return res.json({
      success: true,
      data: {
        user_id: user.id,
        full_name: user.full_name,
        email: user.email,
        profile: {
          biography: profileData.profile.biography,
          linkedin_url: profileData.profile.linkedin_url,
          profile_image_data: profileData.profile.profile_image_data,
        },
        degrees: profileData.degrees,
        certifications: profileData.certifications,
        licences: profileData.licences,
        short_courses: profileData.shortCourses,
        employment_history: profileData.employmentHistory,
        slot_date: todayDate,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch featured alumnus.",
    });
  }
}

module.exports = {
  getFeaturedAlumnus,
};
