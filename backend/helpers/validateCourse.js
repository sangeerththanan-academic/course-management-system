const LEVELS = new Set(["Beginner", "Intermediate", "Advanced"]);
const DURATION_PATTERN = /^[1-9]\d* (Days|Weeks|Months)$/;
const PRICE_PATTERN = /^-?\d+(?:\.\d{1,2})?$/;

function trimValue(value) {
  if (typeof value !== "string") {
    return value;
  }

  const str = value;
  const trimmed = str.trim();

  return trimmed;
}

function validateCourse(course = {}) {
  course = course ?? {};

  const title = trimValue(course.title);
  const category = trimValue(course.category);
  const level = trimValue(course.level);
  const duration = trimValue(course.duration);
  const image = trimValue(course.image);
  const description = trimValue(course.description);
  const priceValue = trimValue(course.price);
  const errors = {};

  if (typeof title !== "string" || !title) {
    errors.title = "Title is required";
  } else if (title.length < 3) {
    errors.title = "Title must contain at least 3 characters";
  } else if (title.length > 100) {
    errors.title = "Title cannot exceed 100 characters";
  }

  if (typeof category !== "string" || !category) {
    errors.category = "Category is required";
  } else if (category.length < 2) {
    errors.category = "Category must contain at least 2 characters";
  } else if (category.length > 50) {
    errors.category = "Category cannot exceed 50 characters";
  }

  if (!LEVELS.has(level)) {
    errors.level = "Level must be Beginner, Intermediate, or Advanced";
  }

  if (typeof duration !== "string" || !duration) {
    errors.duration = "Duration is required";
  } else if (!DURATION_PATTERN.test(duration)) {
    errors.duration = "Duration must be a positive integer followed by Days, Weeks, or Months";
  }

  if (priceValue === undefined || priceValue === null || priceValue === "") {
    errors.price = "Price is required";
  } else if (typeof priceValue !== "number" && typeof priceValue !== "string") {
    errors.price = "Price must be a number";
  } else if (typeof priceValue === "number" && !Number.isFinite(priceValue)) {
    errors.price = "Price must be a number";
  } else if (typeof priceValue === "string" && !PRICE_PATTERN.test(priceValue)) {
    errors.price = "Price must be a number with up to two decimal places";
  } else {
    const numericPrice = Number(priceValue);

    if (numericPrice < 0) {
      errors.price = "Price cannot be negative";
    } else if (numericPrice > 1000000) {
      errors.price = "Price cannot exceed 1000000";
    } else if (Math.round(numericPrice * 100) !== numericPrice * 100) {
      errors.price = "Price must have no more than two decimal places";
    }
  }

  if (image !== undefined && image !== null && typeof image !== "string") {
    errors.image = "Image must be a valid HTTP or HTTPS URL";
  } else if (image && image.length > 500) {
    errors.image = "Image URL cannot exceed 500 characters";
  } else if (image) {
    try {
      const imageUrl = new URL(image);

      if (!["http:", "https:"].includes(imageUrl.protocol)) {
        errors.image = "Image must be a valid HTTP or HTTPS URL";
      }
    } catch (error) {
      errors.image = "Image must be a valid HTTP or HTTPS URL";
    }
  }

  if (description !== undefined && description !== null && typeof description !== "string") {
    errors.description = "Description must be text";
  } else if (description && description.length > 1000) {
    errors.description = "Description cannot exceed 1000 characters";
  }

  return {
    errors,
    data: {
      title,
      category,
      level,
      duration,
      price: Number(priceValue),
      image: image || null,
      description: description || null,
    },
  };
}

module.exports = validateCourse;