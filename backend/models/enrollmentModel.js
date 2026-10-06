const db = require("../config/db");

const Enrollment = {

  // Create enrollment
  async create(studentId, courseId) {
    const [result] = await db.execute(
      `INSERT INTO enrollments
       (student_id, course_id)
       VALUES (?, ?)`,
      [studentId, courseId]
    );

    return result.insertId;
  },


  // Find a specific enrollment by ID
  async findById(id) {
    const [rows] = await db.execute(
      `SELECT *
       FROM enrollments
       WHERE id = ?`,
      [id]
    );

    return rows[0];
  },


  // Check if student is already enrolled
  async findByStudentAndCourse(studentId, courseId) {
    const [rows] = await db.execute(
      `SELECT *
       FROM enrollments
       WHERE student_id = ?
       AND course_id = ?`,
      [studentId, courseId]
    );

    return rows[0];
  },


  // Get all courses enrolled by a student
  async getByStudent(studentId) {
    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,
          c.id AS course_id,
          c.title,
          c.category,
          c.level,
          c.duration,
          c.price,
          c.image,
          c.description
       FROM enrollments e
       JOIN courses c
         ON e.course_id = c.id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC`,
      [studentId]
    );

    return rows;
  },


  // Get all students enrolled in a course
  async getByCourse(courseId) {
    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,
          u.id AS student_id,
          u.username,
          u.full_name
       FROM enrollments e
       JOIN users u
         ON e.student_id = u.id
       WHERE e.course_id = ?
       ORDER BY e.enrolled_at DESC`,
      [courseId]
    );

    return rows;
  },


  // Get all enrollments
  async getAll() {
    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,

          u.id AS student_id,
          u.username,
          u.full_name,

          c.id AS course_id,
          c.title,
          c.category,
          c.level

       FROM enrollments e

       JOIN users u
         ON e.student_id = u.id

       JOIN courses c
         ON e.course_id = c.id

       ORDER BY e.enrolled_at DESC`
    );

    return rows;
  },


  // Delete enrollment by ID and optional student ownership
  async delete(id, studentId = null) {
    const query = studentId === null
      ? `DELETE FROM enrollments
         WHERE id = ?`
      : `DELETE FROM enrollments
         WHERE id = ?
         AND student_id = ?`;

    const params = studentId === null
      ? [id]
      : [id, studentId];

    const [result] = await db.execute(query, params);

    return result;
  },

};

module.exports = Enrollment;
