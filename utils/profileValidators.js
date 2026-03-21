"use strict";

function trimValue(value) {
  return String(value || "").trim();
}

function isValidUrl(value) {
  const text = trimValue(value);
  if (!text) return true;

  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function isValidDate(value) {
  const text = trimValue(value);
  if (!text) return true;

  const date = new Date(text);
  return !Number.isNaN(date.getTime());
}

function validateRequiredText(label, value) {
  if (!trimValue(value)) {
    return `${label} is required.`;
  }
  return null;
}

function validateOptionalUrl(label, value) {
  if (!isValidUrl(value)) {
    return `${label} must be a valid URL.`;
  }
  return null;
}

function validateOptionalDate(label, value) {
  if (!isValidDate(value)) {
    return `${label} must be a valid date.`;
  }
  return null;
}

function validateStartEndDates(startDate, endDate) {
  const start = trimValue(startDate);
  const end = trimValue(endDate);

  if (start && end) {
    const startObj = new Date(start);
    const endObj = new Date(end);

    if (endObj < startObj) {
      return "End date cannot be earlier than start date.";
    }
  }

  return null;
}

function validateBase64Image(imageData) {
  const text = trimValue(imageData);

  if (!text) {
    return "Please choose an image first.";
  }

  if (!text.startsWith("data:image/")) {
    return "Image must be a valid base64 image data URL.";
  }

  return null;
}

module.exports = {
  trimValue,
  validateRequiredText,
  validateOptionalUrl,
  validateOptionalDate,
  validateStartEndDates,
  validateBase64Image,
};
