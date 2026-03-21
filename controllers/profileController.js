"use strict";

const profileDao = require("../dao/profileDao");
const {
  trimValue,
  validateRequiredText,
  validateOptionalUrl,
  validateOptionalDate,
  validateStartEndDates,
  validateBase64Image,
} = require("../utils/profileValidators");

function getCompletion(profileData) {
  let score = 0;
  const total = 6;

  if (trimValue(profileData.profile.biography)) score += 1;
  if (trimValue(profileData.profile.linkedin_url)) score += 1;
  if (trimValue(profileData.profile.profile_image_data)) score += 1;
  if (profileData.degrees.length > 0) score += 1;
  if (
    profileData.certifications.length > 0 ||
    profileData.licences.length > 0 ||
    profileData.shortCourses.length > 0
  )
    score += 1;
  if (profileData.employmentHistory.length > 0) score += 1;

  return {
    score,
    total,
    percent: Math.round((score / total) * 100),
  };
}

async function renderProfilePage(req, res, options = {}) {
  const userId = req.session.user.id;
  const profileData = await profileDao.getFullProfileData(userId);
  const completion = getCompletion(profileData);

  res.render("profile/index", {
    success: options.success || null,
    error: options.error || null,
    profile: profileData.profile,
    degrees: profileData.degrees,
    certifications: profileData.certifications,
    licences: profileData.licences,
    shortCourses: profileData.shortCourses,
    employmentHistory: profileData.employmentHistory,
    completion,
  });
}

function redirectSuccess(res, message) {
  const encoded = encodeURIComponent(message);
  res.redirect(`/profile?success=${encoded}`);
}

async function showProfilePage(req, res) {
  const success = req.query.success ? String(req.query.success) : null;
  await renderProfilePage(req, res, { success });
}

async function updateBasicProfile(req, res) {
  try {
    const userId = req.session.user.id;
    const biography = trimValue(req.body.biography);
    const linkedinUrl = trimValue(req.body.linkedin_url);

    const urlError = validateOptionalUrl("LinkedIn URL", linkedinUrl);
    if (urlError) {
      return renderProfilePage(req, res, { error: urlError });
    }

    await profileDao.ensureProfileExists(userId);
    await profileDao.updateBasicProfile(userId, {
      biography,
      linkedinUrl,
    });

    return redirectSuccess(res, "Basic profile updated successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, {
      error: "Failed to update basic profile.",
    });
  }
}

async function updateProfileImage(req, res) {
  try {
    const userId = req.session.user.id;
    const imageData = trimValue(req.body.profile_image_data);

    const imageError = validateBase64Image(imageData);
    if (imageError) {
      return renderProfilePage(req, res, { error: imageError });
    }

    await profileDao.ensureProfileExists(userId);
    await profileDao.updateProfileImage(userId, imageData);

    return redirectSuccess(res, "Profile image updated successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, {
      error: "Failed to update profile image.",
    });
  }
}

async function addDegree(req, res) {
  try {
    const userId = req.session.user.id;
    const degreeName = trimValue(req.body.degree_name);
    const institutionName = trimValue(req.body.institution_name);
    const degreeUrl = trimValue(req.body.degree_url);
    const completionDate = trimValue(req.body.completion_date);

    const error =
      validateRequiredText("Degree name", degreeName) ||
      validateRequiredText("Institution name", institutionName) ||
      validateOptionalUrl("Degree URL", degreeUrl) ||
      validateOptionalDate("Completion date", completionDate);

    if (error) {
      return renderProfilePage(req, res, { error });
    }

    await profileDao.addDegree(userId, {
      degreeName,
      institutionName,
      degreeUrl,
      completionDate,
    });

    return redirectSuccess(res, "Degree added successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, { error: "Failed to add degree." });
  }
}

async function updateDegree(req, res) {
  try {
    const userId = req.session.user.id;
    const id = req.params.id;
    const degreeName = trimValue(req.body.degree_name);
    const institutionName = trimValue(req.body.institution_name);
    const degreeUrl = trimValue(req.body.degree_url);
    const completionDate = trimValue(req.body.completion_date);

    const error =
      validateRequiredText("Degree name", degreeName) ||
      validateRequiredText("Institution name", institutionName) ||
      validateOptionalUrl("Degree URL", degreeUrl) ||
      validateOptionalDate("Completion date", completionDate);

    if (error) {
      return renderProfilePage(req, res, { error });
    }

    await profileDao.updateDegree(userId, id, {
      degreeName,
      institutionName,
      degreeUrl,
      completionDate,
    });

    return redirectSuccess(res, "Degree updated successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, { error: "Failed to update degree." });
  }
}

async function deleteDegree(req, res) {
  try {
    const userId = req.session.user.id;
    await profileDao.deleteDegree(userId, req.params.id);
    return redirectSuccess(res, "Degree deleted successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, { error: "Failed to delete degree." });
  }
}

async function addCertification(req, res) {
  try {
    const userId = req.session.user.id;
    const certificationName = trimValue(req.body.certification_name);
    const providerName = trimValue(req.body.provider_name);
    const certificationUrl = trimValue(req.body.certification_url);
    const completionDate = trimValue(req.body.completion_date);

    const error =
      validateRequiredText("Certification name", certificationName) ||
      validateRequiredText("Provider name", providerName) ||
      validateOptionalUrl("Certification URL", certificationUrl) ||
      validateOptionalDate("Completion date", completionDate);

    if (error) {
      return renderProfilePage(req, res, { error });
    }

    await profileDao.addCertification(userId, {
      certificationName,
      providerName,
      certificationUrl,
      completionDate,
    });

    return redirectSuccess(res, "Certification added successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, {
      error: "Failed to add certification.",
    });
  }
}

async function updateCertification(req, res) {
  try {
    const userId = req.session.user.id;
    const id = req.params.id;
    const certificationName = trimValue(req.body.certification_name);
    const providerName = trimValue(req.body.provider_name);
    const certificationUrl = trimValue(req.body.certification_url);
    const completionDate = trimValue(req.body.completion_date);

    const error =
      validateRequiredText("Certification name", certificationName) ||
      validateRequiredText("Provider name", providerName) ||
      validateOptionalUrl("Certification URL", certificationUrl) ||
      validateOptionalDate("Completion date", completionDate);

    if (error) {
      return renderProfilePage(req, res, { error });
    }

    await profileDao.updateCertification(userId, id, {
      certificationName,
      providerName,
      certificationUrl,
      completionDate,
    });

    return redirectSuccess(res, "Certification updated successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, {
      error: "Failed to update certification.",
    });
  }
}

async function deleteCertification(req, res) {
  try {
    const userId = req.session.user.id;
    await profileDao.deleteCertification(userId, req.params.id);
    return redirectSuccess(res, "Certification deleted successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, {
      error: "Failed to delete certification.",
    });
  }
}

async function addLicence(req, res) {
  try {
    const userId = req.session.user.id;
    const licenceName = trimValue(req.body.licence_name);
    const awardingBody = trimValue(req.body.awarding_body);
    const licenceUrl = trimValue(req.body.licence_url);
    const completionDate = trimValue(req.body.completion_date);

    const error =
      validateRequiredText("Licence name", licenceName) ||
      validateRequiredText("Awarding body", awardingBody) ||
      validateOptionalUrl("Licence URL", licenceUrl) ||
      validateOptionalDate("Completion date", completionDate);

    if (error) {
      return renderProfilePage(req, res, { error });
    }

    await profileDao.addLicence(userId, {
      licenceName,
      awardingBody,
      licenceUrl,
      completionDate,
    });

    return redirectSuccess(res, "Licence added successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, { error: "Failed to add licence." });
  }
}

async function updateLicence(req, res) {
  try {
    const userId = req.session.user.id;
    const id = req.params.id;
    const licenceName = trimValue(req.body.licence_name);
    const awardingBody = trimValue(req.body.awarding_body);
    const licenceUrl = trimValue(req.body.licence_url);
    const completionDate = trimValue(req.body.completion_date);

    const error =
      validateRequiredText("Licence name", licenceName) ||
      validateRequiredText("Awarding body", awardingBody) ||
      validateOptionalUrl("Licence URL", licenceUrl) ||
      validateOptionalDate("Completion date", completionDate);

    if (error) {
      return renderProfilePage(req, res, { error });
    }

    await profileDao.updateLicence(userId, id, {
      licenceName,
      awardingBody,
      licenceUrl,
      completionDate,
    });

    return redirectSuccess(res, "Licence updated successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, { error: "Failed to update licence." });
  }
}

async function deleteLicence(req, res) {
  try {
    const userId = req.session.user.id;
    await profileDao.deleteLicence(userId, req.params.id);
    return redirectSuccess(res, "Licence deleted successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, { error: "Failed to delete licence." });
  }
}

async function addShortCourse(req, res) {
  try {
    const userId = req.session.user.id;
    const courseName = trimValue(req.body.course_name);
    const providerName = trimValue(req.body.provider_name);
    const courseUrl = trimValue(req.body.course_url);
    const completionDate = trimValue(req.body.completion_date);

    const error =
      validateRequiredText("Course name", courseName) ||
      validateRequiredText("Provider name", providerName) ||
      validateOptionalUrl("Course URL", courseUrl) ||
      validateOptionalDate("Completion date", completionDate);

    if (error) {
      return renderProfilePage(req, res, { error });
    }

    await profileDao.addShortCourse(userId, {
      courseName,
      providerName,
      courseUrl,
      completionDate,
    });

    return redirectSuccess(res, "Short course added successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, {
      error: "Failed to add short course.",
    });
  }
}

async function updateShortCourse(req, res) {
  try {
    const userId = req.session.user.id;
    const id = req.params.id;
    const courseName = trimValue(req.body.course_name);
    const providerName = trimValue(req.body.provider_name);
    const courseUrl = trimValue(req.body.course_url);
    const completionDate = trimValue(req.body.completion_date);

    const error =
      validateRequiredText("Course name", courseName) ||
      validateRequiredText("Provider name", providerName) ||
      validateOptionalUrl("Course URL", courseUrl) ||
      validateOptionalDate("Completion date", completionDate);

    if (error) {
      return renderProfilePage(req, res, { error });
    }

    await profileDao.updateShortCourse(userId, id, {
      courseName,
      providerName,
      courseUrl,
      completionDate,
    });

    return redirectSuccess(res, "Short course updated successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, {
      error: "Failed to update short course.",
    });
  }
}

async function deleteShortCourse(req, res) {
  try {
    const userId = req.session.user.id;
    await profileDao.deleteShortCourse(userId, req.params.id);
    return redirectSuccess(res, "Short course deleted successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, {
      error: "Failed to delete short course.",
    });
  }
}

async function addEmployment(req, res) {
  try {
    const userId = req.session.user.id;
    const jobTitle = trimValue(req.body.job_title);
    const companyName = trimValue(req.body.company_name);
    const startDate = trimValue(req.body.start_date);
    const endDate = trimValue(req.body.end_date);

    const error =
      validateRequiredText("Job title", jobTitle) ||
      validateRequiredText("Company name", companyName) ||
      validateOptionalDate("Start date", startDate) ||
      validateOptionalDate("End date", endDate) ||
      validateStartEndDates(startDate, endDate);

    if (error) {
      return renderProfilePage(req, res, { error });
    }

    await profileDao.addEmployment(userId, {
      jobTitle,
      companyName,
      startDate,
      endDate,
    });

    return redirectSuccess(res, "Employment history added successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, {
      error: "Failed to add employment history.",
    });
  }
}

async function updateEmployment(req, res) {
  try {
    const userId = req.session.user.id;
    const id = req.params.id;
    const jobTitle = trimValue(req.body.job_title);
    const companyName = trimValue(req.body.company_name);
    const startDate = trimValue(req.body.start_date);
    const endDate = trimValue(req.body.end_date);

    const error =
      validateRequiredText("Job title", jobTitle) ||
      validateRequiredText("Company name", companyName) ||
      validateOptionalDate("Start date", startDate) ||
      validateOptionalDate("End date", endDate) ||
      validateStartEndDates(startDate, endDate);

    if (error) {
      return renderProfilePage(req, res, { error });
    }

    await profileDao.updateEmployment(userId, id, {
      jobTitle,
      companyName,
      startDate,
      endDate,
    });

    return redirectSuccess(res, "Employment history updated successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, {
      error: "Failed to update employment history.",
    });
  }
}

async function deleteEmployment(req, res) {
  try {
    const userId = req.session.user.id;
    await profileDao.deleteEmployment(userId, req.params.id);
    return redirectSuccess(res, "Employment history deleted successfully.");
  } catch (error) {
    console.error(error);
    return renderProfilePage(req, res, {
      error: "Failed to delete employment history.",
    });
  }
}

module.exports = {
  showProfilePage,
  updateBasicProfile,
  updateProfileImage,
  addDegree,
  updateDegree,
  deleteDegree,
  addCertification,
  updateCertification,
  deleteCertification,
  addLicence,
  updateLicence,
  deleteLicence,
  addShortCourse,
  updateShortCourse,
  deleteShortCourse,
  addEmployment,
  updateEmployment,
  deleteEmployment,
};
