import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { FaChartBar, FaGraduationCap, FaShoppingCart, FaSignInAlt } from "react-icons/fa";

import api from "../services/api";
import { isLoggedIn, isStudent, isAdmin } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function CourseDetails() {

  const { id } = useParams();
  const location = useLocation();

  const [course, setCourse] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [enrolling, setEnrolling] = useState(false);
  const [enrollment, setEnrollment] = useState(null);

  const availabilityText = course
    ? (course.max_students === null || course.max_students === undefined
      ? "Unlimited"
      : course.is_full
        ? "Course Full"
        : `${course.enrolled_count ?? 0} / ${course.max_students} students`)
    : "";


  // Read the login state from localStorage.
  const loggedIn = isLoggedIn();
  const studentLoggedIn = isStudent();
  const adminLoggedIn = isAdmin();


  // ---------- Load the course ----------
  useEffect(() => {

    const getCourse = async () => {

      try {

        const response = await api.get(`/courses/${id}`);
        setCourse(response.data.course);

        if (studentLoggedIn) {
          const enrollmentsResponse = await api.get("/enrollments/my");
          const currentEnrollment = enrollmentsResponse.data.enrollments?.find(
            (entry) => Number(entry.course_id) === Number(id)
          );
          setEnrollment(currentEnrollment || null);
        }

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load course"
        );

      } finally {

        setLoading(false);

      }
    };

    getCourse();

  }, [id, studentLoggedIn]);


  // ---------- Enroll ----------
  const handleEnroll = async () => {

    setError("");
    setSuccess("");
    setEnrolling(true);

    try {

      const response = await api.post("/enrollments", {
        // The backend reads courseId from the request body
        courseId: id,
      });

      setSuccess(response.data.message);
      setEnrollment({ status: "pending" });

    } catch (error) {

      // 409 = already enrolled. This is expected, not a crash.
      if (error.response?.status === 409) {
        setEnrollment((current) => current || { status: "approved" });
        setError(
          "You are already enrolled in this course. You can see it in My Enrollments."
        );

      } else {

        setError(
          error.response?.data?.message ||
          "Enrollment failed. Please try again."
        );

      }

    } finally {

      setEnrolling(false);

    }
  };


  // ---------- Loading ----------
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p className="loading">Loading course...</p>
        </div>
      </>
    );
  }


  // ---------- Course not found / server error ----------
  if (error && !course) {
    return (
      <>
        <Navbar />

        <div className="container">

          <p className="error">{error}</p>

          <div className="center-actions">
            <Link to="/courses" className="btn btn-primary">
              Back to Courses
            </Link>
          </div>

        </div>
      </>
    );
  }


  return (

    <>
      <Navbar />

      <div className="container">

        {/* Breadcrumb */}
        <p className="breadcrumb">
          <Link to="/courses">Courses</Link>
          <span> / </span>
          <span>{course.title}</span>
        </p>


        <div className="details-layout">

          {/* ---------- Left: image ---------- */}

          <div className="details-image-wrapper">
            <img
              src={course.image}
              alt={course.title}
              className="details-image"
            />
          </div>


          {/* ---------- Right: information ---------- */}

          <div className="details-info">

            <div className="course-card-tags">
              <span className="tag tag-category">{course.category}</span>
              <span className="tag tag-level">{course.level}</span>
            </div>


            <h1>{course.title}</h1>


            <p className="details-description">{course.description}</p>


            <dl className="details-list">

              <div>
                <dt>Category</dt>
                <dd>{course.category}</dd>
              </div>

              <div>
                <dt>Level</dt>
                <dd>{course.level}</dd>
              </div>

              <div>
                <dt>Duration</dt>
                <dd>{course.duration}</dd>
              </div>

              <div>
                <dt>Price</dt>
                <dd className="details-price">Rs. {course.price}</dd>
              </div>

              <div>
                <dt>Availability</dt>
                <dd>{availabilityText}</dd>
              </div>

            </dl>



            {/* ---------- Messages ---------- */}

            {success && <p className="success">{success}</p>}

            {error && <p className="error">{error}</p>}


            {/* ---------- Action area (role based) ---------- */}

            <div className="details-actions">

              {/* Not logged in: invite the visitor to login */}
              {!loggedIn && (
                <div className="notice">
                  <p>
                    Please login as a student to enroll in this course.
                  </p>

                  <Link
                    to="/login"
                    state={{ from: location.pathname }}
                    className="btn btn-primary"
                  >
                    <FaSignInAlt />
                    Login to Enroll
                  </Link>
                </div>
              )}


              {/* Logged in as a student: show the Enroll button */}
              {studentLoggedIn && (
                <>
                  {course.is_full && (!enrollment || enrollment.status === "rejected") ? (
                    <p className="error">Course Full. No remaining seats are available.</p>
                  ) : !enrollment || enrollment.status === "rejected" ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={handleEnroll}
                      disabled={enrolling || course.is_full}
                    >
                      <FaShoppingCart />
                      {enrolling
                        ? "Submitting..."
                        : enrollment?.status === "rejected"
                          ? "Request Again"
                          : "Request Enrollment"}
                    </button>
                  ) : (
                    <p className={enrollment.status === "approved" ? "success" : "notice"}>
                      {enrollment.status === "approved"
                        ? "You are enrolled in this course."
                        : "Request Pending Approval"}
                    </p>
                  )}
                  {enrollment?.status === "rejected" && enrollment.decision_note && (
                    <p className="error">Rejected: {enrollment.decision_note}</p>
                  )}

                  <Link to="/my-enrollments" className="btn btn-outline">
                    <FaGraduationCap />
                    My Enrollments
                  </Link>
                </>
              )}


              {/* Logged in as an admin: explain why there is no Enroll button */}
              {adminLoggedIn && (
                <div className="notice">
                  <p>
                    You are logged in as an administrator. Only students
                    can enroll in courses.
                  </p>

                  <Link to="/admin/courses" className="btn btn-primary">
                    <FaChartBar />
                    Manage Courses
                  </Link>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      <Footer />

    </>
  );
}

export default CourseDetails;
