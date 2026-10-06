const db = require("../config/db");

function trimValue(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim();
}

function normalizeCourseRecord(course) {
  if (!course) {
    return null;
  }

  const enrolledCount = Number(course.enrolled_count ?? 0);
  const maxStudents = course.max_students === null || course.max_students === undefined
    ? null
    : Number(course.max_students);

  const seatsRemaining = maxStudents === null
    ? null
    : Math.max(maxStudents - enrolledCount, 0);

  return {
    ...course,
    max_students: maxStudents,
    enrolled_count: enrolledCount,
    seats_remaining: seatsRemaining,
    is_full: maxStudents !== null && enrolledCount >= maxStudents,
  };
}

const Course = {

  // Get all courses
  async getAll() {
    const [rows] = await db.execute(
      `SELECT
          c.*,
          COUNT(e.id) AS enrolled_count
       FROM courses c
       LEFT JOIN enrollments e
         ON e.course_id = c.id
       GROUP BY c.id
       ORDER BY c.id ASC`
    );

    return rows.map(normalizeCourseRecord);
  },


  // Get one course
  async getById(id) {
    const [rows] = await db.execute(
      `SELECT
          c.*,
          COUNT(e.id) AS enrolled_count
       FROM courses c
       LEFT JOIN enrollments e
         ON e.course_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`,
      [id]
    );

    return normalizeCourseRecord(rows[0]);
  },


  async countEnrollments(courseId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS enrolled_count
       FROM enrollments
       WHERE course_id = ?`,
      [courseId]
    );

    return Number(rows[0]?.enrolled_count ?? 0);
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
      max_students: rawMaxStudents,
    } = course;

    const title = trimValue(rawTitle);
    const category = trimValue(rawCategory);
    const level = trimValue(rawLevel);
    const duration = trimValue(rawDuration);
    const image = trimValue(rawImage);
    const description = trimValue(rawDescription);
    const maxStudents = rawMaxStudents === "" || rawMaxStudents === undefined || rawMaxStudents === null
      ? null
      : Number(rawMaxStudents);

    const [result] = await db.execute(
      `INSERT INTO courses
       (title, category, level, duration, price, image, description, max_students)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
        maxStudents,
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
      max_students: rawMaxStudents,
    } = course;

    const title = trimValue(rawTitle);
    const category = trimValue(rawCategory);
    const level = trimValue(rawLevel);
    const duration = trimValue(rawDuration);
    const image = trimValue(rawImage);
    const description = trimValue(rawDescription);
    const maxStudents = rawMaxStudents === "" || rawMaxStudents === undefined || rawMaxStudents === null
      ? null
      : Number(rawMaxStudents);

    const [result] = await db.execute(
      `UPDATE courses
       SET title = ?,
           category = ?,
           level = ?,
           duration = ?,
           price = ?,
           image = ?,
           description = ?,
           max_students = ?
       WHERE id = ?`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
        maxStudents,
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
