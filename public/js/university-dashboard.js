(function () {
  var charts = {};
  var latestDashboardData = null;

  function $(id) {
    return document.getElementById(id);
  }

  function getToken() {
    return localStorage.getItem("AnalyticsApiToken") || "";
  }

  function setToken(value) {
    localStorage.setItem("AnalyticsApiToken", value || "");
  }

  function showError(message) {
    var errorBox = $("errorBox");
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.style.display = "block";
  }

  function hideError() {
    var errorBox = $("errorBox");
    if (!errorBox) return;
    errorBox.textContent = "";
    errorBox.style.display = "none";
  }

  function setLoading(isLoading) {
    var loadingBox = $("loadingBox");
    if (loadingBox) loadingBox.style.display = isLoading ? "block" : "none";
  }

  function buildQueryString() {
    var params = new URLSearchParams();

    if ($("programmeFilter") && $("programmeFilter").value) {
      params.set("programme", $("programmeFilter").value);
    }

    if ($("graduationYearFilter") && $("graduationYearFilter").value) {
      params.set("graduation_year", $("graduationYearFilter").value);
    }

    if ($("industrySectorFilter") && $("industrySectorFilter").value) {
      params.set("industry_sector", $("industrySectorFilter").value);
    }

    return params.toString();
  }

  async function apiGet(url) {
    var token = getToken();

    if (!token) {
      throw new Error("Paste an Analytics Dashboard API token first.");
    }

    var response = await fetch(url, {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    var json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || "API request failed.");
    }

    return json.data;
  }

  function fillSelect(selectId, rows, placeholder) {
    var select = $(selectId);
    if (!select) return;

    var currentValue = select.value;
    select.innerHTML = "";

    var empty = document.createElement("option");
    empty.value = "";
    empty.textContent = placeholder;
    select.appendChild(empty);

    rows.forEach(function (row) {
      if (row.value === null || row.value === undefined || row.value === "") return;

      var option = document.createElement("option");
      option.value = row.value;
      option.textContent = row.value;
      select.appendChild(option);
    });

    select.value = currentValue;
  }

  async function loadFilterOptions() {
    var data = await apiGet("/api/v1/analytics/filter-options");

    fillSelect("programmeFilter", data.programmes || [], "All programmes");
    fillSelect("graduationYearFilter", data.graduationYears || [], "All graduation years");
    fillSelect("industrySectorFilter", data.industrySectors || [], "All industry sectors");
  }

  function labels(rows) {
    return rows.map(function (row) {
      return row.label || "Unknown";
    });
  }

  function values(rows) {
    return rows.map(function (row) {
      return Number(row.value || 0);
    });
  }

  function destroyChart(id) {
    if (charts[id]) {
      charts[id].destroy();
      delete charts[id];
    }
  }

  function createChart(id, type, title, rows, options) {
    destroyChart(id);

    var canvas = $(id);
    if (!canvas) return;

    charts[id] = new Chart(canvas, {
      type: type,
      data: {
        labels: labels(rows),
        datasets: [
          {
            label: title,
            data: values(rows),
            borderWidth: 2,
            fill: type === "line" ? false : true,
          },
        ],
      },
      options: Object.assign(
        {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 700 },
          plugins: {
            legend: { display: true },
            tooltip: { enabled: true },
            title: { display: true, text: title },
          },
          scales:
            type === "pie" || type === "doughnut" || type === "radar"
              ? {}
              : {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "Count" },
                  },
                  x: {
                    title: { display: true, text: "Category" },
                  },
                },
        },
        options || {}
      ),
    });
  }

  function updateSummary(summary) {
    if ($("totalAlumni")) $("totalAlumni").textContent = summary.total_alumni;
    if ($("totalDevelopment")) $("totalDevelopment").textContent = summary.total_development_items;
    if ($("averageDevelopment")) $("averageDevelopment").textContent = summary.average_development_per_alumnus;
    if ($("totalCountries")) $("totalCountries").textContent = summary.total_countries;
  }

  function updateInsights(rows) {
    var box = $("insightsBox");
    if (!box) return;

    box.innerHTML = "";

    if (!rows || rows.length === 0) {
      box.textContent = "No skills gap signals for the selected filters.";
      return;
    }

    rows.forEach(function (row) {
      var count = Number(row.value || 0);
      var level = "normal";
      var label = "Normal";

      if (count >= 8) {
        level = "critical";
        label = "Critical";
      } else if (count >= 5) {
        level = "significant";
        label = "Significant";
      } else if (count >= 2) {
        level = "emerging";
        label = "Emerging";
      }

      var item = document.createElement("div");
      item.className = "insight " + level;
      item.textContent = row.label + ": " + count + " (" + label + ")";
      box.appendChild(item);
    });
  }

  function escapeHtml(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderAlumniTable(rows) {
    var body = $("alumniTableBody");
    if (!body) return;

    body.innerHTML = "";

    rows.forEach(function (row) {
      var tr = document.createElement("tr");

      tr.innerHTML =
        "<td>" + escapeHtml(row.full_name) + "</td>" +
        "<td>" + escapeHtml(row.programmes || "") + "</td>" +
        "<td>" + escapeHtml(row.graduation_year || "") + "</td>" +
        "<td>" + escapeHtml(row.current_industry_sector || "") + "</td>" +
        "<td>" + escapeHtml(row.job_titles || "") + "</td>" +
        "<td>" + escapeHtml(row.employers || "") + "</td>" +
        "<td>" + escapeHtml((row.current_city || "") + ", " + (row.current_country || "")) + "</td>";

      body.appendChild(tr);
    });
  }

  async function loadDashboard() {
    try {
      hideError();
      setLoading(true);

      var tokenInput = $("apiTokenInput");
      if (tokenInput && tokenInput.value.trim()) {
        setToken(tokenInput.value.trim());
      }

      await loadFilterOptions();

      var query = buildQueryString();
      var data = await apiGet(
        "/api/v1/analytics/dashboard-data" + (query ? "?" + query : "")
      );

      latestDashboardData = data;

      updateSummary(data.summary);
      updateInsights(data.charts.skillsGapCategories);
      renderAlumniTable(data.alumniList || []);

      createChart("chartProgramme", "bar", "Alumni by Programme", data.charts.alumniByProgramme || []);
      createChart("chartGraduation", "line", "Graduation Trend", data.charts.graduationTrend || []);
      createChart("chartIndustry", "pie", "Employment by Industry Sector", data.charts.industryDistribution || []);
      createChart("chartJobs", "bar", "Most Common Job Titles", data.charts.topJobTitles || [], { indexAxis: "y" });
      createChart("chartEmployers", "bar", "Top Employers", data.charts.topEmployers || []);
      createChart("chartGeo", "doughnut", "Geographic Distribution", data.charts.geographicDistribution || []);
      createChart("chartDevelopment", "radar", "Professional Development Types", data.charts.developmentTypes || []);
      createChart("chartSkills", "bar", "Curriculum Skills Gap Signals", data.charts.skillsGapCategories || []);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function csvCell(value) {
    var text = String(value === null || value === undefined ? "" : value);
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function exportCsv() {
    if (!latestDashboardData || !latestDashboardData.alumniList) {
      showError("Load dashboard data before exporting CSV.");
      return;
    }

    var rows = latestDashboardData.alumniList;

    var csv =
      "Name,Email,Programmes,Graduation Year,Industry Sector,Job Titles,Employers,City,Country,Certifications,Courses,Licences\n";

    rows.forEach(function (row) {
      csv += [
        row.full_name,
        row.email,
        row.programmes,
        row.graduation_year,
        row.current_industry_sector,
        row.job_titles,
        row.employers,
        row.current_city,
        row.current_country,
        row.certification_count,
        row.short_course_count,
        row.licence_count,
      ]
        .map(csvCell)
        .join(",") + "\n";
    });

    var blob = new Blob([csv], { type: "text/csv" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "alumni-analytics-export.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function downloadChartImages() {
    Object.keys(charts).forEach(function (id) {
      var link = document.createElement("a");
      link.href = charts[id].toBase64Image();
      link.download = id + ".png";
      link.click();
    });
  }

  function savePreset() {
    var preset = {
      programme: $("programmeFilter") ? $("programmeFilter").value : "",
      graduationYear: $("graduationYearFilter") ? $("graduationYearFilter").value : "",
      industrySector: $("industrySectorFilter") ? $("industrySectorFilter").value : "",
    };

    localStorage.setItem("AnalyticsFilterPreset", JSON.stringify(preset));
    alert("Filter preset saved in this browser.");
  }

  function loadPreset() {
    var text = localStorage.getItem("AnalyticsFilterPreset");

    if (!text) {
      alert("No filter preset saved yet.");
      return;
    }

    var preset = JSON.parse(text);

    if ($("programmeFilter")) $("programmeFilter").value = preset.programme || "";
    if ($("graduationYearFilter")) $("graduationYearFilter").value = preset.graduationYear || "";
    if ($("industrySectorFilter")) $("industrySectorFilter").value = preset.industrySector || "";
  }

  function printReport() {
    if (!latestDashboardData) {
      showError("Load dashboard data before generating a report.");
      return;
    }

    window.print();
  }

  window.addEventListener("DOMContentLoaded", function () {
    var tokenInput = $("apiTokenInput");
    if (tokenInput) tokenInput.value = getToken();

    if ($("loadDashboardButton")) $("loadDashboardButton").addEventListener("click", loadDashboard);
    if ($("exportCsvButton")) $("exportCsvButton").addEventListener("click", exportCsv);
    if ($("downloadChartsButton")) $("downloadChartsButton").addEventListener("click", downloadChartImages);
    if ($("savePresetButton")) $("savePresetButton").addEventListener("click", savePreset);
    if ($("loadPresetButton")) $("loadPresetButton").addEventListener("click", loadPreset);
    if ($("printReportButton")) $("printReportButton").addEventListener("click", printReport);
  });
})();