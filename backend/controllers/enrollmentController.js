const db = require("../config/db");
const Enrollment = require("../models/enrollmentModel");
const Course = require("../models/courseModel");

const VALID_STATUSES = new Set(["pending", "approved", "rejected"]);

// Submit an enrollment request. Rejected requests may be submitted again.
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.id;

    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
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

      const [existingRows] = await connection.execute(
        `SELECT id
                , status
         FROM enrollments
         WHERE student_id = ?
         AND course_id = ?
         LIMIT 1`,
        [studentId, courseId]
      );

      if (existingRows.length > 0) {
        const existing = existingRows[0];
        if (existing.status === "rejected") {
          await connection.execute(
            `UPDATE enrollments
             SET status = 'pending',
                 reviewed_by = NULL,
                 reviewed_at = NULL,
                 decision_note = NULL,
                 enrolled_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [existing.id]
          );
          await connection.commit();
          return res.status(201).json({
            message: "Enrollment request submitted for approval",
            enrollmentId: existing.id,
          });
        }

        await connection.rollback();
        return res.status(409).json({
          message: existing.status === "pending"
            ? "You already have a pending request for this course"
            : "You are already enrolled in this course",
        });
      }

      const [result] = await connection.execute(
        `INSERT INTO enrollments
         (student_id, course_id, status)
         VALUES (?, ?, 'pending')`,
        [studentId, courseId]
      );

      await connection.commit();

      res.status(201).json({
        message: "Enrollment request submitted for approval",
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

// Approve or reject a pending enrollment.
const updateEnrollmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason = "" } = req.body;
  const reviewerId = req.user.id;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ message: "Invalid enrollment ID" });
  }
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be approved or rejected" });
  }
  if (status === "rejected" && !String(reason).trim()) {
    return res.status(400).json({ message: "A rejection reason is required" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [enrollmentRows] = await connection.execute(
      "SELECT * FROM enrollments WHERE id = ? FOR UPDATE",
      [id]
    );
    const enrollment = enrollmentRows[0];
    if (!enrollment) {
      await connection.rollback();
      return res.status(404).json({ message: "Enrollment not found" });
    }
    if (enrollment.status !== "pending") {
      await connection.rollback();
      return res.status(409).json({ message: "Only pending enrollments may be processed" });
    }

    if (status === "approved") {
      const [courseRows] = await connection.execute(
        "SELECT * FROM courses WHERE id = ? FOR UPDATE",
        [enrollment.course_id]
      );
      const course = courseRows[0];
      if (!course) {
        await connection.rollback();
        return res.status(404).json({ message: "Course not found" });
      }

      const [duplicateRows] = await connection.execute(
        `SELECT id FROM enrollments
         WHERE student_id = ? AND course_id = ? AND status = 'approved'`,
        [enrollment.student_id, enrollment.course_id]
      );
      if (duplicateRows.length > 0) {
        await connection.rollback();
        return res.status(409).json({ message: "The student is already enrolled in this course" });
      }

      const [countRows] = await connection.execute(
        `SELECT COUNT(*) AS enrolled_count
         FROM enrollments
         WHERE course_id = ? AND status = 'approved'`,
        [enrollment.course_id]
      );
      const maxStudents = course.max_students === null ? null : Number(course.max_students);
      if (maxStudents !== null && Number(countRows[0].enrolled_count) >= maxStudents) {
        await connection.rollback();
        return res.status(409).json({ message: "This course is full. No seats remaining." });
      }
    }

    await connection.execute(
      `UPDATE enrollments
       SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, decision_note = ?
       WHERE id = ? AND status = 'pending'`,
      [status, reviewerId, status === "rejected" ? String(reason).trim() : null, id]
    );
    await connection.commit();
    return res.status(200).json({
      message: `Enrollment ${status} successfully`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating enrollment status:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
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
    const { status } = req.query;
    if (status && !VALID_STATUSES.has(status)) {
      return res.status(400).json({ message: "Invalid enrollment status" });
    }

    const course = await Course.getById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const enrollments = await Enrollment.getByCourse(courseId, status || null);

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
    const { status } = req.query;
    if (status && !VALID_STATUSES.has(status)) {
      return res.status(400).json({ message: "Invalid enrollment status" });
    }
    const enrollments = await Enrollment.getAll(status || null);

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

    if (enrollment.status !== "pending") {
      return res.status(409).json({
        message: "Only pending enrollment requests may be cancelled",
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
  updateEnrollmentStatus,
  deleteEnrollment,
  cancelEnrollment
};
