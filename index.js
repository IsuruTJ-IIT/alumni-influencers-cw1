"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const morgan = require("morgan");
const methodOverride = require("method-override");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const biddingRoutes = require("./routes/biddingRoutes");
const { startBiddingScheduler } = require("./services/biddingService");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));
app.use(methodOverride("_method"));

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

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.use("/", authRoutes);
app.use("/", profileRoutes);
app.use("/", biddingRoutes);

startBiddingScheduler();

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(
    `Server running on ${process.env.APP_BASE_URL || `http://localhost:${port}`}`,
  );
});
