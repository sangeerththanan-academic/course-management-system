const db = require("../config/db");
const Enrollment = require("../models/enrollmentModel");
const Course = require("../models/courseModel");

// Enroll in a course
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.id;

    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    const course = await Course.getById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [courseRows] = await connection.execute(
        "SELECT * FROM courses WHERE id = ? FOR UPDATE",
        [courseId]
      );

      const lockedCourse = courseRows[0];

      if (!lockedCourse) {
        await connection.rollback();
        return res.status(404).json({
          message: "Course not found",
        });
      }

      const existingEnrollment = await connection.execute(
        `SELECT id
         FROM enrollments
         WHERE student_id = ?
         AND course_id = ?
         LIMIT 1`,
        [studentId, courseId]
      );

      if (existingEnrollment[0].length > 0) {
        await connection.rollback();
        return res.status(409).json({
          message: "You are already enrolled in this course",
        });
      }

      const [countRows] = await connection.execute(
        `SELECT COUNT(*) AS enrolled_count
         FROM enrollments
         WHERE course_id = ?`,
        [courseId]
      );

      const enrolledCount = Number(countRows[0]?.enrolled_count ?? 0);
      const maxStudents = lockedCourse.max_students === null || lockedCourse.max_students === undefined
        ? null
        : Number(lockedCourse.max_students);

      if (maxStudents !== null && enrolledCount >= maxStudents) {
        await connection.rollback();
        return res.status(409).json({
          message: "This course is full. No seats remaining.",
        });
      }

      const [result] = await connection.execute(
        `INSERT INTO enrollments
         (student_id, course_id)
         VALUES (?, ?)`,
        [studentId, courseId]
      );

      await connection.commit();

      res.status(201).json({
        message: "Course enrollment successful",
        enrollmentId: result.insertId,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error(
      "Error enrolling in course:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Get logged-in student's courses
const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user.id;

    const enrollments =
      await Enrollment.getByStudent(studentId);

    res.status(200).json({
      message: "Enrollments retrieved successfully",
      enrollments,
    });

  } catch (error) {
    console.error(
      "Error getting student enrollments:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Get students enrolled in a course
const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.getById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const enrollments =
      await Enrollment.getByCourse(courseId);

    res.status(200).json({
      message: "Course enrollments retrieved successfully",
      course,
      enrollments,
    });

  } catch (error) {
    console.error(
      "Error getting course enrollments:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Get all enrollments
const getAllEnrollments = async (req, res) => {
  try {
    const enrollments =
      await Enrollment.getAll();

    res.status(200).json({
      message: "All enrollments retrieved successfully",
      enrollments,
    });

  } catch (error) {
    console.error(
      "Error getting all enrollments:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Delete enrollment
const deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        message: "Invalid enrollment ID",
      });
    }

    const result = await Enrollment.delete(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found",
      });
    }

    res.status(200).json({
      message: "Enrollment deleted successfully",
    });

  } catch (error) {
    console.error(
      "Error deleting enrollment:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Cancel enrollment
const cancelEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        message: "Invalid enrollment ID",
      });
    }

    const enrollment = await Enrollment.findById(id);

    if (!enrollment) {
      return res.status(404).json({
        message: "Enrollment not found",
      });
    }

    if (Number(enrollment.student_id) !== Number(studentId)) {
      return res.status(404).json({
        message: "Enrollment not found",
      });
    }

    const result = await Enrollment.delete(id, studentId);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found",
      });
    }

    res.status(200).json({
      message: "Enrollment cancelled successfully",
    });

  } catch (error) {
    console.error(
      "Error cancelling enrollment:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


module.exports = {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  deleteEnrollment,
  cancelEnrollment
};
