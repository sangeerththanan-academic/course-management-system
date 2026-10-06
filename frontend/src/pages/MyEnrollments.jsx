import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaTrash } from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function MyEnrollments() {

  const [enrollments, setEnrollments] = useState([]);
  const [sortBy, setSortBy] = useState("date-desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const user = getUser();
  const total = enrollments.reduce(
    (sum, enrollment) => {
      const price = Number(enrollment.price);
      return sum + (Number.isFinite(price) ? price : 0);
    },
    0
  );
  const distinctCategoryCount = new Set(
    enrollments
      .map((enrollment) => enrollment.category?.trim().toLowerCase())
      .filter(Boolean)
  ).size;
  const sortedEnrollments = [...enrollments].sort((first, second) => {
    switch (sortBy) {
      case "date-asc":
        return new Date(first.enrolled_at) - new Date(second.enrolled_at);
      case "price-asc":
        return Number(first.price) - Number(second.price);
      case "price-desc":
        return Number(second.price) - Number(first.price);
      case "title-asc":
        return first.title.localeCompare(second.title, undefined, { sensitivity: "base" });
      case "date-desc":
      default:
        return new Date(second.enrolled_at) - new Date(first.enrolled_at);
    }
  });

  // ---------- Load the logged-in student's enrollments ----------
  const loadEnrollments = async () => {
    setLoading(true);
    setError("");

    try {

      const response = await api.get("/enrollments/my");

      setEnrollments(
        Array.isArray(response.data.enrollments)
          ? response.data.enrollments
          : []
      );

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Failed to load your enrollments"
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadEnrollments();
  }, []);

  const handleCancelEnrollment = async (enrollmentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this enrollment?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setCancellingId(enrollmentId);

    try {
      const response = await api.delete(`/enrollments/my/${enrollmentId}`);

      setSuccess(response.data.message || "Enrollment cancelled successfully");
      await loadEnrollments();

    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Could not cancel this enrollment."
      );

    } finally {
      setCancellingId(null);
    }
  };


  // Format "2026-09-21T10:15:00.000Z" into a readable date
  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString();
  };


  return (

    <>
      <Navbar />

      <div className="container">

        <div className="page-header">

          <div>
            <h1>My Enrollments</h1>

            <p className="page-subtitle">
              {user?.full_name
                ? `${user.full_name}, these are the courses you are enrolled in.`
                : "These are the courses you are enrolled in."}
            </p>
            <p className="page-subtitle">
              Total Enrolled Courses: {enrollments.length}
            </p>
            <p className="page-subtitle">
              Total value of enrolled courses: Rs. {total.toLocaleString("en-IN")}
            </p>
            <p className="page-subtitle">
              Average course price: Rs. {(
                enrollments.length > 0 ? total / enrollments.length : 0
              ).toFixed(2)}
            </p>
            <p className="page-subtitle">
              Number of distinct categories: {distinctCategoryCount}
            </p>
          

          </div>

          <Link to="/courses" className="btn btn-primary">
            <FaSearch />
            Browse More Courses
          </Link>

        </div>


        {/* ---------- Loading ---------- */}

        {loading && (
          <p className="loading">Loading your enrollments...</p>
        )}


        {/* ---------- Error ---------- */}

        {success && !loading && (
          <p className="success">{success}</p>
        )}

        {error && !loading && (
          <p className="error">{error}</p>
        )}


        {/* ---------- Empty state ---------- */}

        {!loading && !error && enrollments.length === 0 && (
          <div className="empty-box">
            <p className="empty">
              You have not enrolled in any courses yet.
            </p>

            <Link to="/courses" className="btn btn-primary">
              <FaSearch />
              Find a Course
            </Link>
          </div>
        )}


        {/* ---------- Enrollment cards ---------- */}

        {!loading && !error && enrollments.length > 0 && (
          <div className="filter-field enrollment-sort">
            <label htmlFor="enrollment-sort">Sort by</label>
            <select
              id="enrollment-sort"
              className="input"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="date-desc">Newest Enrolled</option>
              <option value="date-asc">Oldest Enrolled</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="title-asc">Course Title: A to Z</option>
            </select>
          </div>
        )}

        {!loading && !error && enrollments.length > 0 && (

          <div className="course-grid">

            {sortedEnrollments.map((enrollment) => (

              <article className="course-card" key={enrollment.id}>

                <img
                  src={enrollment.image}
                  alt={enrollment.title}
                  className="course-card-image"
                  loading="lazy"
                />

                <div className="course-card-body">

                  <div className="course-card-tags">
                    <span className="tag tag-category">
                      {enrollment.category}
                    </span>

                    <span className="tag tag-level">
                      {enrollment.level}
                    </span>
                  </div>


                  <h3 className="course-card-title">
                    {enrollment.title}
                  </h3>


                  <p className="course-card-summary">
                    {enrollment.description?.slice(0, 100)}
                    {enrollment.description?.length > 100 ? "..." : ""}
                  </p>


                  <ul className="course-card-meta">

                    <li>
                      <strong>Duration:</strong> {enrollment.duration}
                    </li>

                    <li>
                      <strong>Price:</strong> Rs. {enrollment.price}
                    </li>

                    <li>
                      <strong>Enrolled on:</strong>{" "}
                      {formatDate(enrollment.enrolled_at)}
                    </li>

                  </ul>


                  <div className="course-card-actions">
                    <Link
                      to={`/courses/${enrollment.course_id}`}
                      className="btn btn-outline btn-block"
                    >
                      View Course
                    </Link>

                    <button
                      type="button"
                      className="btn btn-danger btn-block"
                      onClick={() => handleCancelEnrollment(enrollment.id)}
                      disabled={cancellingId === enrollment.id}
                    >
                      <FaTrash />
                      {cancellingId === enrollment.id
                        ? "Cancelling..."
                        : "Cancel Enrollment"}
                    </button>
                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

      </div>

      <Footer />

    </>
  );
}

export default MyEnrollments;
