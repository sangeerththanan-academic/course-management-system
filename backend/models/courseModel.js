const db = require("../config/db");

function trimValue(value) {
  if (typeof value !== "string") {
    return value;
  }

  const str = value;
  const trimmed = str.trim();

  return trimmed;
}

const Course = {

  // Get all courses
  async getAll() {
    const [rows] = await db.execute(
      "SELECT * FROM courses"
    );

    return rows;
  },


  // Get one course
  async getById(id) {
    const [rows] = await db.execute(
      "SELECT * FROM courses WHERE id = ?",
      [id]
    );

    return rows[0];
  },


  // Find a course with the same title, optionally excluding one course.
  async findByTitle(title, excludeId = null) {
    const trimmedTitle = trimValue(title);
    const query = excludeId === null
      ? "SELECT id FROM courses WHERE title = ? LIMIT 1"
      : "SELECT id FROM courses WHERE title = ? AND id <> ? LIMIT 1";
    const values = excludeId === null ? [trimmedTitle] : [trimmedTitle, excludeId];
    const [rows] = await db.execute(query, values);

    return rows[0];
  },


  // Create course
  async create(course) {

    const {
      title: rawTitle,
      category: rawCategory,
      level: rawLevel,
      duration: rawDuration,
      price,
      image: rawImage,
      description: rawDescription,
    } = course;

    const title = trimValue(rawTitle);
    const category = trimValue(rawCategory);
    const level = trimValue(rawLevel);
    const duration = trimValue(rawDuration);
    const image = trimValue(rawImage);
    const description = trimValue(rawDescription);

    const [result] = await db.execute(
      `INSERT INTO courses
       (title, category, level, duration, price, image, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
      ]
    );

    return result.insertId;
  },


  // Update course
  async update(id, course) {

    const {
      title: rawTitle,
      category: rawCategory,
      level: rawLevel,
      duration: rawDuration,
      price,
      image: rawImage,
      description: rawDescription,
    } = course;

    const title = trimValue(rawTitle);
    const category = trimValue(rawCategory);
    const level = trimValue(rawLevel);
    const duration = trimValue(rawDuration);
    const image = trimValue(rawImage);
    const description = trimValue(rawDescription);

    const [result] = await db.execute(
      `UPDATE courses
       SET title = ?,
           category = ?,
           level = ?,
           duration = ?,
           price = ?,
           image = ?,
           description = ?
       WHERE id = ?`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
        id,
      ]
    );

    return result;
  },


  // Delete course
  async delete(id) {

    const [result] = await db.execute(
      "DELETE FROM courses WHERE id = ?",
      [id]
    );

    return result;
  },

};

module.exports = Course;
