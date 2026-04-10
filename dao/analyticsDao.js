"use strict";

const db = require("../config/database");

function cleanFilters(rawFilters) {
  return {
    programme: String(rawFilters.programme || "").trim(),
    graduationYear: String(rawFilters.graduationYear || "").trim(),
    industrySector: String(rawFilters.industrySector || "").trim(),
  };
}

function buildWhere(rawFilters) {
  const filters = cleanFilters(rawFilters);
  const clauses = ["u.role = 'alumnus'", "u.is_verified = TRUE"];
  const params = [];

  if (filters.programme) {
    clauses.push("d.degree_name = ?");
    params.push(filters.programme);
  }

  if (filters.graduationYear) {
    clauses.push("YEAR(d.completion_date) = ?");
    params.push(filters.graduationYear);
  }

  if (filters.industrySector) {
    clauses.push("p.current_industry_sector = ?");
    params.push(filters.industrySector);
  }

  return {
    whereSql: "WHERE " + clauses.join(" AND "),
    params,
  };
}

async function getFilterOptions() {
  const [programmes] = await db.execute(
    `SELECT DISTINCT degree_name AS value
     FROM degrees
     WHERE degree_name IS NOT NULL AND degree_name <> ''
     ORDER BY degree_name`
  );

  const [graduationYears] = await db.execute(
    `SELECT DISTINCT YEAR(completion_date) AS value
     FROM degrees
     WHERE completion_date IS NOT NULL
     ORDER BY value DESC`
  );

  const [industrySectors] = await db.execute(
    `SELECT DISTINCT current_industry_sector AS value
     FROM alumni_profiles
     WHERE current_industry_sector IS NOT NULL
       AND current_industry_sector <> ''
     ORDER BY current_industry_sector`
  );

  return {
    programmes,
    graduationYears,
    industrySectors,
  };
}

async function getAlumniList(rawFilters) {
  const { whereSql, params } = buildWhere(rawFilters);

  const [rows] = await db.execute(
    `SELECT
       u.id,
       u.full_name,
       u.email,
       p.linkedin_url,
       p.current_industry_sector,
       p.current_city,
       p.current_country,
       GROUP_CONCAT(DISTINCT d.degree_name ORDER BY d.completion_date SEPARATOR ', ') AS programmes,
       MIN(YEAR(d.completion_date)) AS graduation_year,
       GROUP_CONCAT(DISTINCT e.job_title ORDER BY e.start_date DESC SEPARATOR ', ') AS job_titles,
       GROUP_CONCAT(DISTINCT e.company_name ORDER BY e.start_date DESC SEPARATOR ', ') AS employers,
       COUNT(DISTINCT c.id) AS certification_count,
       COUNT(DISTINCT sc.id) AS short_course_count,
       COUNT(DISTINCT l.id) AS licence_count
     FROM users u
     INNER JOIN alumni_profiles p ON p.user_id = u.id
     LEFT JOIN degrees d ON d.user_id = u.id
     LEFT JOIN employment_history e ON e.user_id = u.id
     LEFT JOIN certifications c ON c.user_id = u.id
     LEFT JOIN short_courses sc ON sc.user_id = u.id
     LEFT JOIN licences l ON l.user_id = u.id
     ${whereSql}
     GROUP BY
       u.id,
       u.full_name,
       u.email,
       p.linkedin_url,
       p.current_industry_sector,
       p.current_city,
       p.current_country
     ORDER BY u.full_name`,
    params
  );

  return rows;
}

async function getSummary(rawFilters) {
  const { whereSql, params } = buildWhere(rawFilters);

  const [rows] = await db.execute(
    `SELECT
       COUNT(DISTINCT u.id) AS total_alumni,
       COUNT(DISTINCT c.id) AS total_certifications,
       COUNT(DISTINCT sc.id) AS total_short_courses,
       COUNT(DISTINCT l.id) AS total_licences,
       COUNT(DISTINCT p.current_industry_sector) AS total_industry_sectors,
       COUNT(DISTINCT p.current_country) AS total_countries
     FROM users u
     INNER JOIN alumni_profiles p ON p.user_id = u.id
     LEFT JOIN degrees d ON d.user_id = u.id
     LEFT JOIN certifications c ON c.user_id = u.id
     LEFT JOIN short_courses sc ON sc.user_id = u.id
     LEFT JOIN licences l ON l.user_id = u.id
     ${whereSql}`,
    params
  );

  const row = rows[0] || {};
  const totalAlumni = Number(row.total_alumni || 0);
  const totalDevelopment =
    Number(row.total_certifications || 0) +
    Number(row.total_short_courses || 0) +
    Number(row.total_licences || 0);

  return {
    total_alumni: totalAlumni,
    total_certifications: Number(row.total_certifications || 0),
    total_short_courses: Number(row.total_short_courses || 0),
    total_licences: Number(row.total_licences || 0),
    total_development_items: totalDevelopment,
    average_development_per_alumnus:
      totalAlumni === 0
        ? 0
        : Number((totalDevelopment / totalAlumni).toFixed(2)),
    total_industry_sectors: Number(row.total_industry_sectors || 0),
    total_countries: Number(row.total_countries || 0),
  };
}

async function grouped(rawFilters, selectSql, joinSql, groupSql, orderSql, limitSql) {
  const { whereSql, params } = buildWhere(rawFilters);

  const [rows] = await db.execute(
    `SELECT ${selectSql}
     FROM users u
     INNER JOIN alumni_profiles p ON p.user_id = u.id
     LEFT JOIN degrees d ON d.user_id = u.id
     ${joinSql || ""}
     ${whereSql}
     ${groupSql}
     ${orderSql || ""}
     ${limitSql || ""}`,
    params
  );

  return rows;
}

async function getDashboardData(rawFilters) {
  const filters = cleanFilters(rawFilters);

  const summary = await getSummary(filters);

  const alumniByProgramme = await grouped(
    filters,
    "d.degree_name AS label, COUNT(DISTINCT u.id) AS value",
    "",
    "GROUP BY d.degree_name HAVING label IS NOT NULL",
    "ORDER BY value DESC",
    "LIMIT 10"
  );

  const graduationTrend = await grouped(
    filters,
    "YEAR(d.completion_date) AS label, COUNT(DISTINCT u.id) AS value",
    "",
    "GROUP BY YEAR(d.completion_date) HAVING label IS NOT NULL",
    "ORDER BY label ASC",
    ""
  );

  const industryDistribution = await grouped(
    filters,
    "p.current_industry_sector AS label, COUNT(DISTINCT u.id) AS value",
    "",
    "GROUP BY p.current_industry_sector HAVING label IS NOT NULL",
    "ORDER BY value DESC",
    "LIMIT 10"
  );

  const topJobTitles = await grouped(
    filters,
    "e.job_title AS label, COUNT(DISTINCT e.id) AS value",
    "INNER JOIN employment_history e ON e.user_id = u.id",
    "GROUP BY e.job_title HAVING label IS NOT NULL",
    "ORDER BY value DESC",
    "LIMIT 10"
  );

  const topEmployers = await grouped(
    filters,
    "e.company_name AS label, COUNT(DISTINCT e.id) AS value",
    "INNER JOIN employment_history e ON e.user_id = u.id",
    "GROUP BY e.company_name HAVING label IS NOT NULL",
    "ORDER BY value DESC",
    "LIMIT 10"
  );

  const geographicDistribution = await grouped(
    filters,
    "CONCAT(COALESCE(p.current_city, 'Unknown city'), ', ', COALESCE(p.current_country, 'Unknown country')) AS label, COUNT(DISTINCT u.id) AS value",
    "",
    "GROUP BY p.current_city, p.current_country",
    "ORDER BY value DESC",
    "LIMIT 10"
  );

  const { whereSql, params } = buildWhere(filters);

  const [developmentTypes] = await db.execute(
    `SELECT item_type AS label, COUNT(DISTINCT item_key) AS value
     FROM (
       SELECT user_id, CONCAT('cert-', id) AS item_key, 'Certifications' AS item_type FROM certifications
       UNION ALL
       SELECT user_id, CONCAT('course-', id) AS item_key, 'Short Courses' AS item_type FROM short_courses
       UNION ALL
       SELECT user_id, CONCAT('licence-', id) AS item_key, 'Licences' AS item_type FROM licences
     ) items
     INNER JOIN users u ON u.id = items.user_id
     INNER JOIN alumni_profiles p ON p.user_id = u.id
     LEFT JOIN degrees d ON d.user_id = u.id
     ${whereSql}
     GROUP BY item_type
     ORDER BY value DESC`,
    params
  );

  const [skillsGapCategories] = await db.execute(
    `SELECT skill_category AS label, COUNT(DISTINCT item_key) AS value
     FROM (
       SELECT user_id, CONCAT('cert-', id) AS item_key,
         CASE
           WHEN LOWER(certification_name) LIKE '%aws%'
             OR LOWER(certification_name) LIKE '%azure%'
             OR LOWER(certification_name) LIKE '%cloud%'
             OR LOWER(certification_name) LIKE '%gcp%' THEN 'Cloud'
           WHEN LOWER(certification_name) LIKE '%docker%'
             OR LOWER(certification_name) LIKE '%kubernetes%' THEN 'Containers'
           WHEN LOWER(certification_name) LIKE '%python%'
             OR LOWER(certification_name) LIKE '%sql%'
             OR LOWER(certification_name) LIKE '%data%'
             OR LOWER(certification_name) LIKE '%tableau%' THEN 'Data Analytics'
           WHEN LOWER(certification_name) LIKE '%scrum%'
             OR LOWER(certification_name) LIKE '%agile%' THEN 'Agile / Scrum'
           WHEN LOWER(certification_name) LIKE '%security%'
             OR LOWER(certification_name) LIKE '%cyber%' THEN 'Cybersecurity'
           ELSE 'Other'
         END AS skill_category
       FROM certifications

       UNION ALL

       SELECT user_id, CONCAT('course-', id) AS item_key,
         CASE
           WHEN LOWER(course_name) LIKE '%aws%'
             OR LOWER(course_name) LIKE '%azure%'
             OR LOWER(course_name) LIKE '%cloud%'
             OR LOWER(course_name) LIKE '%gcp%' THEN 'Cloud'
           WHEN LOWER(course_name) LIKE '%docker%'
             OR LOWER(course_name) LIKE '%kubernetes%' THEN 'Containers'
           WHEN LOWER(course_name) LIKE '%python%'
             OR LOWER(course_name) LIKE '%sql%'
             OR LOWER(course_name) LIKE '%data%'
             OR LOWER(course_name) LIKE '%tableau%' THEN 'Data Analytics'
           WHEN LOWER(course_name) LIKE '%scrum%'
             OR LOWER(course_name) LIKE '%agile%' THEN 'Agile / Scrum'
           WHEN LOWER(course_name) LIKE '%security%'
             OR LOWER(course_name) LIKE '%cyber%' THEN 'Cybersecurity'
           ELSE 'Other'
         END AS skill_category
       FROM short_courses
     ) items
     INNER JOIN users u ON u.id = items.user_id
     INNER JOIN alumni_profiles p ON p.user_id = u.id
     LEFT JOIN degrees d ON d.user_id = u.id
     ${whereSql}
     GROUP BY skill_category
     ORDER BY value DESC`,
    params
  );

  const alumniList = await getAlumniList(filters);

  return {
    filters,
    summary,
    charts: {
      alumniByProgramme,
      graduationTrend,
      industryDistribution,
      topJobTitles,
      topEmployers,
      geographicDistribution,
      developmentTypes,
      skillsGapCategories,
    },
    alumniList,
  };
}

module.exports = {
  getFilterOptions,
  getAlumniList,
  getDashboardData,
};