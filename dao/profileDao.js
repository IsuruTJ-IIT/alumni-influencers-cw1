"use strict";

const db = require("../config/database");

async function ensureProfileExists(userId) {
  await db.execute(
    `INSERT IGNORE INTO alumni_profiles (user_id, biography, linkedin_url, profile_image_data)
     VALUES (?, NULL, NULL, NULL)`,
    [userId],
  );
}

async function getProfileByUserId(userId) {
  const [rows] = await db.execute(
    "SELECT * FROM alumni_profiles WHERE user_id = ? LIMIT 1",
    [userId],
  );
  return rows[0] || null;
}

async function updateBasicProfile(userId, { biography, linkedinUrl }) {
  await db.execute(
    `UPDATE alumni_profiles
     SET biography = ?, linkedin_url = ?
     WHERE user_id = ?`,
    [biography, linkedinUrl, userId],
  );
}

async function updateProfileImage(userId, imageData) {
  await db.execute(
    `UPDATE alumni_profiles
     SET profile_image_data = ?
     WHERE user_id = ?`,
    [imageData, userId],
  );
}

async function getDegrees(userId) {
  const [rows] = await db.execute(
    "SELECT * FROM degrees WHERE user_id = ? ORDER BY id DESC",
    [userId],
  );
  return rows;
}

async function addDegree(userId, data) {
  await db.execute(
    `INSERT INTO degrees (user_id, degree_name, institution_name, degree_url, completion_date)
     VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      data.degreeName,
      data.institutionName,
      data.degreeUrl || null,
      data.completionDate || null,
    ],
  );
}

async function updateDegree(userId, id, data) {
  await db.execute(
    `UPDATE degrees
     SET degree_name = ?, institution_name = ?, degree_url = ?, completion_date = ?
     WHERE id = ? AND user_id = ?`,
    [
      data.degreeName,
      data.institutionName,
      data.degreeUrl || null,
      data.completionDate || null,
      id,
      userId,
    ],
  );
}

async function deleteDegree(userId, id) {
  await db.execute("DELETE FROM degrees WHERE id = ? AND user_id = ?", [
    id,
    userId,
  ]);
}

async function getCertifications(userId) {
  const [rows] = await db.execute(
    "SELECT * FROM certifications WHERE user_id = ? ORDER BY id DESC",
    [userId],
  );
  return rows;
}

async function addCertification(userId, data) {
  await db.execute(
    `INSERT INTO certifications (user_id, certification_name, provider_name, certification_url, completion_date)
     VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      data.certificationName,
      data.providerName,
      data.certificationUrl || null,
      data.completionDate || null,
    ],
  );
}

async function updateCertification(userId, id, data) {
  await db.execute(
    `UPDATE certifications
     SET certification_name = ?, provider_name = ?, certification_url = ?, completion_date = ?
     WHERE id = ? AND user_id = ?`,
    [
      data.certificationName,
      data.providerName,
      data.certificationUrl || null,
      data.completionDate || null,
      id,
      userId,
    ],
  );
}

async function deleteCertification(userId, id) {
  await db.execute("DELETE FROM certifications WHERE id = ? AND user_id = ?", [
    id,
    userId,
  ]);
}

async function getLicences(userId) {
  const [rows] = await db.execute(
    "SELECT * FROM licences WHERE user_id = ? ORDER BY id DESC",
    [userId],
  );
  return rows;
}

async function addLicence(userId, data) {
  await db.execute(
    `INSERT INTO licences (user_id, licence_name, awarding_body, licence_url, completion_date)
     VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      data.licenceName,
      data.awardingBody,
      data.licenceUrl || null,
      data.completionDate || null,
    ],
  );
}

async function updateLicence(userId, id, data) {
  await db.execute(
    `UPDATE licences
     SET licence_name = ?, awarding_body = ?, licence_url = ?, completion_date = ?
     WHERE id = ? AND user_id = ?`,
    [
      data.licenceName,
      data.awardingBody,
      data.licenceUrl || null,
      data.completionDate || null,
      id,
      userId,
    ],
  );
}

async function deleteLicence(userId, id) {
  await db.execute("DELETE FROM licences WHERE id = ? AND user_id = ?", [
    id,
    userId,
  ]);
}

async function getShortCourses(userId) {
  const [rows] = await db.execute(
    "SELECT * FROM short_courses WHERE user_id = ? ORDER BY id DESC",
    [userId],
  );
  return rows;
}

async function addShortCourse(userId, data) {
  await db.execute(
    `INSERT INTO short_courses (user_id, course_name, provider_name, course_url, completion_date)
     VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      data.courseName,
      data.providerName,
      data.courseUrl || null,
      data.completionDate || null,
    ],
  );
}

async function updateShortCourse(userId, id, data) {
  await db.execute(
    `UPDATE short_courses
     SET course_name = ?, provider_name = ?, course_url = ?, completion_date = ?
     WHERE id = ? AND user_id = ?`,
    [
      data.courseName,
      data.providerName,
      data.courseUrl || null,
      data.completionDate || null,
      id,
      userId,
    ],
  );
}

async function deleteShortCourse(userId, id) {
  await db.execute("DELETE FROM short_courses WHERE id = ? AND user_id = ?", [
    id,
    userId,
  ]);
}

async function getEmploymentHistory(userId) {
  const [rows] = await db.execute(
    "SELECT * FROM employment_history WHERE user_id = ? ORDER BY id DESC",
    [userId],
  );
  return rows;
}

async function addEmployment(userId, data) {
  await db.execute(
    `INSERT INTO employment_history (user_id, job_title, company_name, start_date, end_date)
     VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      data.jobTitle,
      data.companyName,
      data.startDate || null,
      data.endDate || null,
    ],
  );
}

async function updateEmployment(userId, id, data) {
  await db.execute(
    `UPDATE employment_history
     SET job_title = ?, company_name = ?, start_date = ?, end_date = ?
     WHERE id = ? AND user_id = ?`,
    [
      data.jobTitle,
      data.companyName,
      data.startDate || null,
      data.endDate || null,
      id,
      userId,
    ],
  );
}

async function deleteEmployment(userId, id) {
  await db.execute(
    "DELETE FROM employment_history WHERE id = ? AND user_id = ?",
    [id, userId],
  );
}

async function getFullProfileData(userId) {
  await ensureProfileExists(userId);

  const profile = await getProfileByUserId(userId);
  const degrees = await getDegrees(userId);
  const certifications = await getCertifications(userId);
  const licences = await getLicences(userId);
  const shortCourses = await getShortCourses(userId);
  const employmentHistory = await getEmploymentHistory(userId);

  return {
    profile,
    degrees,
    certifications,
    licences,
    shortCourses,
    employmentHistory,
  };
}

module.exports = {
  ensureProfileExists,
  getProfileByUserId,
  updateBasicProfile,
  updateProfileImage,
  getDegrees,
  addDegree,
  updateDegree,
  deleteDegree,
  getCertifications,
  addCertification,
  updateCertification,
  deleteCertification,
  getLicences,
  addLicence,
  updateLicence,
  deleteLicence,
  getShortCourses,
  addShortCourse,
  updateShortCourse,
  deleteShortCourse,
  getEmploymentHistory,
  addEmployment,
  updateEmployment,
  deleteEmployment,
  getFullProfileData,
};
