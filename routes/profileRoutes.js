"use strict";

const express = require("express");
const requireLogin = require("../middleware/requireLogin");
const profileController = require("../controllers/profileController");

const router = express.Router();

router.get("/profile", requireLogin, profileController.showProfilePage);

router.post(
  "/profile/basic",
  requireLogin,
  profileController.updateBasicProfile,
);
router.post(
  "/profile/image",
  requireLogin,
  profileController.updateProfileImage,
);

router.post("/profile/degrees", requireLogin, profileController.addDegree);
router.post(
  "/profile/degrees/:id/update",
  requireLogin,
  profileController.updateDegree,
);
router.post(
  "/profile/degrees/:id/delete",
  requireLogin,
  profileController.deleteDegree,
);

router.post(
  "/profile/certifications",
  requireLogin,
  profileController.addCertification,
);
router.post(
  "/profile/certifications/:id/update",
  requireLogin,
  profileController.updateCertification,
);
router.post(
  "/profile/certifications/:id/delete",
  requireLogin,
  profileController.deleteCertification,
);

router.post("/profile/licences", requireLogin, profileController.addLicence);
router.post(
  "/profile/licences/:id/update",
  requireLogin,
  profileController.updateLicence,
);
router.post(
  "/profile/licences/:id/delete",
  requireLogin,
  profileController.deleteLicence,
);

router.post("/profile/courses", requireLogin, profileController.addShortCourse);
router.post(
  "/profile/courses/:id/update",
  requireLogin,
  profileController.updateShortCourse,
);
router.post(
  "/profile/courses/:id/delete",
  requireLogin,
  profileController.deleteShortCourse,
);

router.post(
  "/profile/employment",
  requireLogin,
  profileController.addEmployment,
);
router.post(
  "/profile/employment/:id/update",
  requireLogin,
  profileController.updateEmployment,
);
router.post(
  "/profile/employment/:id/delete",
  requireLogin,
  profileController.deleteEmployment,
);

module.exports = router;
