/**
 * Generate a unique ID for food items
 * @returns {string} A unique ID with a timestamp and random characters
 */
const getUniqueId = () => {
  // Generate a timestamp-based ID, followed by random characters
  return `food_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

/**
 * Simple sanitization for strings to prevent injection attacks
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (!input || typeof input !== "string") {
    return "";
  }
  // Remove any HTML/script tags and trim
  return input.replace(/<[^>]*>/g, "").trim();
};

/**
 * Format a string for use in URLs (slug format)
 * @param {string} str - String to format
 * @returns {string} URL-friendly string
 */
const slugify = (str) => {
  if (!str || typeof str !== "string") {
    return "";
  }

  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
    .trim(); // Trim leading/trailing whitespace
};

/**
 * Create an error object with additional properties
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Error object with status code
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = {
  getUniqueId,
  sanitizeString,
  slugify,
  createError,
};
