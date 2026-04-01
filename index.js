"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const morgan = require("morgan");
const methodOverride = require("method-override");
const csurf = require("csurf");

const securityHeaders = require("./middleware/securityHeaders");
const simpleCors = require("./middleware/simpleCors");
const createRateLimiter = require("./middleware/createRateLimiter");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const biddingRoutes = require("./routes/biddingRoutes");
const winnerSelectionRoutes = require("./routes/winnerSelectionRoutes");
const developerTokenRoutes = require("./routes/developerTokenRoutes");
const publicApiRoutes = require("./routes/publicApiRoutes");
const apiDocsRoutes = require("./routes/apiDocsRoutes");

const {
  startWinnerSelectionScheduler,
} = require("./services/winnerSelectionService");

const app = express();
const csrfProtection = csurf();

// Rate limiters
const authLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 10 });
const tokenLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 5 });
const apiLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 30 });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Security headers first
app.use(securityHeaders);

// Logging
app.use(morgan("dev"));

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/docs", express.static(path.join(__dirname, "docs")));

// Body parsers
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

// Method override
app.use(methodOverride("_method"));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 30,
    },
  }),
);

// Current user for EJS pages
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// CORS only for API routes
app.use("/api", simpleCors);

// Rate limiting for sensitive routes
app.use("/register", authLimiter);
app.use("/login", authLimiter);
app.use("/forgot-password", authLimiter);
app.use("/reset-password", authLimiter);
app.use("/developer/tokens", tokenLimiter);
app.use("/api/v1/featured-alumnus", apiLimiter);

// CSRF only for web routes, not API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  return csrfProtection(req, res, next);
});

// Expose CSRF token to EJS pages
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.locals.csrfToken = req.csrfToken();
  next();
});

// Home
app.get("/", (req, res) => {
  res.render("home");
});

// Routes
app.use("/", authRoutes);
app.use("/", profileRoutes);
app.use("/", biddingRoutes);
app.use("/", winnerSelectionRoutes);
app.use("/", developerTokenRoutes);
app.use("/", publicApiRoutes);
app.use("/", apiDocsRoutes);

// Start background scheduler
startWinnerSelectionScheduler();

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res
      .status(403)
      .send("Form rejected because the CSRF token was missing or invalid.");
  }

  next(err);
});

// Generic 500
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

// 404
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(
    `Server running on ${process.env.APP_BASE_URL || `http://localhost:${port}`}`,
  );
});
