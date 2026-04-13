"use strict";

const express = require("express");
const requireRole = require("../middleware/requireRole");
const profileController = require("../controllers/profileController");

const router = express.Router();

/*
  Only alumni can manage alumni profiles.
  Developer and university users must not create/edit alumni profiles.
*/
router.use("/profile", requireRole("alumnus"));

router.get("/profile", profileController.showProfilePage);

router.post("/profile/basic", profileController.updateBasicProfile);
router.post("/profile/image", profileController.updateProfileImage);

router.post("/profile/degrees", profileController.addDegree);
router.post("/profile/degrees/:id/update", profileController.updateDegree);
router.post("/profile/degrees/:id/delete", profileController.deleteDegree);

router.post("/profile/certifications", profileController.addCertification);
router.post(
  "/profile/certifications/:id/update",
  profileController.updateCertification,
);
router.post(
  "/profile/certifications/:id/delete",
  profileController.deleteCertification,
);

router.post("/profile/licences", profileController.addLicence);
router.post("/profile/licences/:id/update", profileController.updateLicence);
router.post("/profile/licences/:id/delete", profileController.deleteLicence);

router.post("/profile/courses", profileController.addShortCourse);
router.post("/profile/courses/:id/update", profileController.updateShortCourse);
router.post("/profile/courses/:id/delete", profileController.deleteShortCourse);

router.post("/profile/employment", profileController.addEmployment);
router.post("/profile/employment/:id/update", profileController.updateEmployment);
router.post("/profile/employment/:id/delete", profileController.deleteEmployment);

module.exports = router;