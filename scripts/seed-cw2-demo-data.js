"use strict";

require("dotenv").config();

const bcrypt = require("bcrypt");
const db = require("../config/database");

async function insertUser({ fullName, email, role }) {
  const passwordHash = await bcrypt.hash("Password@123", 10);

  await db.execute(
    `INSERT IGNORE INTO users
       (role, full_name, email, password_hash, is_verified)
     VALUES (?, ?, ?, ?, TRUE)`,
    [role, fullName, email, passwordHash]
  );

  const [rows] = await db.execute(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  return rows[0].id;
}

async function insertProfile(userId, data) {
  await db.execute(
    `INSERT INTO alumni_profiles
       (user_id, biography, linkedin_url, profile_image_data, current_industry_sector, current_city, current_country)
     VALUES (?, ?, ?, NULL, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       biography = VALUES(biography),
       linkedin_url = VALUES(linkedin_url),
       current_industry_sector = VALUES(current_industry_sector),
       current_city = VALUES(current_city),
       current_country = VALUES(current_country)`,
    [
      userId,
      data.biography,
      data.linkedinUrl,
      data.industry,
      data.city,
      data.country,
    ]
  );
}

async function addDegree(userId, degreeName, completionDate) {
  await db.execute(
    `INSERT INTO degrees
       (user_id, degree_name, institution_name, degree_url, completion_date)
     VALUES (?, ?, 'University of Eastminster', 'https://example.com/programme', ?)`,
    [userId, degreeName, completionDate]
  );
}

async function addCertification(userId, name, provider, date) {
  await db.execute(
    `INSERT INTO certifications
       (user_id, certification_name, provider_name, certification_url, completion_date)
     VALUES (?, ?, ?, 'https://example.com/certification', ?)`,
    [userId, name, provider, date]
  );
}

async function addCourse(userId, name, provider, date) {
  await db.execute(
    `INSERT INTO short_courses
       (user_id, course_name, provider_name, course_url, completion_date)
     VALUES (?, ?, ?, 'https://example.com/course', ?)`,
    [userId, name, provider, date]
  );
}

async function addLicence(userId, name, body, date) {
  await db.execute(
    `INSERT INTO licences
       (user_id, licence_name, awarding_body, licence_url, completion_date)
     VALUES (?, ?, ?, 'https://example.com/licence', ?)`,
    [userId, name, body, date]
  );
}

async function addEmployment(userId, jobTitle, companyName, startDate) {
  await db.execute(
    `INSERT INTO employment_history
       (user_id, job_title, company_name, start_date, end_date)
     VALUES (?, ?, ?, ?, NULL)`,
    [userId, jobTitle, companyName, startDate]
  );
}

async function seed() {
  const developerId = await insertUser({
    fullName: "Developer User",
    email: "developer@eastminster.ac.uk",
    role: "developer",
  });

  const universityId = await insertUser({
    fullName: "University Analyst",
    email: "analyst@eastminster.ac.uk",
    role: "university",
  });

  console.log("Developer user ID:", developerId);
  console.log("University user ID:", universityId);

  const alumni = [
    {
      fullName: "Aisha Khan",
      email: "aisha.khan@eastminster.ac.uk",
      degree: "BSc Computer Science",
      graduation: "2022-06-15",
      industry: "Cloud Computing",
      city: "London",
      country: "United Kingdom",
      job: "Cloud Engineer",
      employer: "Northstar Cloud",
      certs: ["AWS Cloud Practitioner", "Docker Foundations"],
      courses: ["Kubernetes Bootcamp"],
      licences: [],
    },
    {
      fullName: "Ben Carter",
      email: "ben.carter@eastminster.ac.uk",
      degree: "BSc Computer Science",
      graduation: "2021-06-15",
      industry: "Cybersecurity",
      city: "Manchester",
      country: "United Kingdom",
      job: "Security Analyst",
      employer: "SecureWorks UK",
      certs: ["Cyber Security Essentials"],
      courses: ["Python for Security"],
      licences: ["Security Practitioner Licence"],
    },
    {
      fullName: "Chloe Silva",
      email: "chloe.silva@eastminster.ac.uk",
      degree: "BA Business Management",
      graduation: "2020-06-15",
      industry: "Data Analytics",
      city: "London",
      country: "United Kingdom",
      job: "Data Analyst",
      employer: "RetailData Ltd",
      certs: ["Tableau Desktop Specialist"],
      courses: ["SQL for Analysts", "Python Data Analytics"],
      licences: [],
    },
    {
      fullName: "Daniel Perera",
      email: "daniel.perera@eastminster.ac.uk",
      degree: "BSc Computer Science",
      graduation: "2023-06-15",
      industry: "Software Engineering",
      city: "Birmingham",
      country: "United Kingdom",
      job: "Backend Developer",
      employer: "Fintech Labs",
      certs: ["Agile Scrum Foundation"],
      courses: ["Docker for Developers"],
      licences: [],
    },
    {
      fullName: "Emma Wilson",
      email: "emma.wilson@eastminster.ac.uk",
      degree: "BA Business Management",
      graduation: "2022-06-15",
      industry: "Project Management",
      city: "Leeds",
      country: "United Kingdom",
      job: "Project Coordinator",
      employer: "BrightPM",
      certs: ["Scrum Master Certification"],
      courses: ["Agile Project Delivery"],
      licences: [],
    },
    {
      fullName: "Farah Ahmed",
      email: "farah.ahmed@eastminster.ac.uk",
      degree: "BSc Data Science",
      graduation: "2023-06-15",
      industry: "Data Analytics",
      city: "Dubai",
      country: "United Arab Emirates",
      job: "BI Analyst",
      employer: "Insight Gulf",
      certs: ["Microsoft Azure Data Fundamentals"],
      courses: ["Power BI Reporting"],
      licences: [],
    },
    {
      fullName: "George Brown",
      email: "george.brown@eastminster.ac.uk",
      degree: "BSc Data Science",
      graduation: "2021-06-15",
      industry: "Artificial Intelligence",
      city: "London",
      country: "United Kingdom",
      job: "Machine Learning Engineer",
      employer: "AI Forge",
      certs: ["Google Cloud ML Engineer"],
      courses: ["Python Machine Learning"],
      licences: [],
    },
    {
      fullName: "Hannah Lee",
      email: "hannah.lee@eastminster.ac.uk",
      degree: "BSc Computer Science",
      graduation: "2020-06-15",
      industry: "Cloud Computing",
      city: "Singapore",
      country: "Singapore",
      job: "DevOps Engineer",
      employer: "CloudOps Asia",
      certs: ["Azure Fundamentals", "Kubernetes Administrator"],
      courses: ["Infrastructure as Code"],
      licences: [],
    },
  ];

  for (const item of alumni) {
    const userId = await insertUser({
      fullName: item.fullName,
      email: item.email,
      role: "alumnus",
    });

    await insertProfile(userId, {
      biography: item.fullName + " is an Eastminster graduate working in " + item.industry + ".",
      linkedinUrl: "https://www.linkedin.com/in/demo",
      industry: item.industry,
      city: item.city,
      country: item.country,
    });

    await addDegree(userId, item.degree, item.graduation);
    await addEmployment(userId, item.job, item.employer, item.graduation);

    for (const cert of item.certs) {
      await addCertification(userId, cert, "Professional Provider", "2024-01-15");
    }

    for (const course of item.courses) {
      await addCourse(userId, course, "Online Academy", "2024-03-15");
    }

    for (const licence of item.licences) {
      await addLicence(userId, licence, "Professional Body", "2024-04-15");
    }
  }

  console.log("CW2 demo data inserted.");
  console.log("Login accounts:");
  console.log("developer@eastminster.ac.uk / Password@123");
  console.log("analyst@eastminster.ac.uk / Password@123");

  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});