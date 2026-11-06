import { useEffect, useState } from "react";
import { FaCheck, FaTrash, FaTimes } from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function ManageEnrollments() {

  // Course list - used to fill the "filter by course" dropdown
  const [courses, setCourses] = useState([]);

  // "" means "show every enrollment"
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // The enrollments currently shown in the table
  const [enrollments, setEnrollments] = useState([]);

  // When one course is selected the backend also returns the course
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Changing this number tells the effect below to reload the table.
  // We use it after a delete so the table shows fresh data.
  const [reloadKey, setReloadKey] = useState(0);
  const [processingId, setProcessingId] = useState(null);
  const [rejectionReasons, setRejectionReasons] = useState({});


  // ---------- Load the course dropdown options (once) ----------
  useEffect(() => {

    const loadCourseOptions = async () => {

      try {

        const response = await api.get("/courses");

        setCourses(response.data.courses);

      } catch (error) {

        // The dropdown is optional, so a failure here is not fatal.
        console.error("Could not load course options:", error.message);

      }
    };

    loadCourseOptions();

  }, []);


  // ---------- Load the enrollment table ----------
  
  useEffect(() => {

    const loadEnrollments = async () => {

      setLoading(true);
      setError("");

      try {

        if (selectedCourseId === "") {

          // ---- All enrollments ----
          const response = await api.get("/enrollments", {
            params: selectedStatus ? { status: selectedStatus } : {},
          });

          setEnrollments(response.data.enrollments);
          setSelectedCourse(null);

        } else {

          // ---- Students enrolled in one course ----
          const response = await api.get(
            `/enrollments/course/${selectedCourseId}`,
            { params: selectedStatus ? { status: selectedStatus } : {} }
          );

          setEnrollments(response.data.enrollments);
          setSelectedCourse(response.data.course);

        }

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load enrollments"
        );

        setEnrollments([]);

      } finally {

        setLoading(false);

      }
    };

    loadEnrollments();

  }, [selectedCourseId, selectedStatus, reloadKey]);

  const handleStatusChange = async (enrollment, status, reason = "") => {
    if (status === "rejected" && !reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    setError("");
    setSuccess("");
    setProcessingId(enrollment.id);
    try {
      const response = await api.patch(`/enrollments/${enrollment.id}/status`, {
        status,
        reason,
      });
      setSuccess(response.data.message);
      setReloadKey((value) => value + 1);
    } catch (error) {
      setError(error.response?.data?.message || "Could not update enrollment status.");
    } finally {
      setProcessingId(null);
    }
  };


  // ---------- Delete an enrollment ----------
  const handleDelete = async (enrollment) => {

    const confirmed = window.confirm(
      `Remove ${enrollment.full_name || enrollment.username}${
        enrollment.title ? ` from "${enrollment.title}"` : ""
      }?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {

      const response = await api.delete(`/enrollments/${enrollment.id}`);

      setSuccess(response.data.message);

      // Ask the effect above to reload the table
      setReloadKey(reloadKey + 1);

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Could not delete the enrollment."
      );

    }
  };


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
            <h1>Manage Enrollments</h1>

            <p className="page-subtitle">
              See who is enrolled in what, and remove enrollments when
              needed.
            </p>
          </div>

        </div>


        {/* ---------- Filter by course ---------- */}

        <div className="filter-bar">

          <div className="form-group">

            <label htmlFor="courseFilter">
              Show enrollments for
            </label>

            <select
              id="courseFilter"
              className="input"
              value={selectedCourseId}
              onChange={(event) => {
                setSuccess("");
                setSelectedCourseId(event.target.value);
              }}
            >
              <option value="">All courses</option>

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}

            </select>

          </div>

          <div className="form-group">
            <label htmlFor="statusFilter">Show status</label>
            <select
              id="statusFilter"
              className="input"
              value={selectedStatus}
              onChange={(event) => {
                setSuccess("");
                setSelectedStatus(event.target.value);
              }}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

        </div>


        {/* ---------- Messages ---------- */}

        {success && <p className="success">{success}</p>}

        {error && <p className="error">{error}</p>}


        {/* ---------- Table ---------- */}

        <section className="section-card">

          <div className="section-card-header">

            <h2>
              {selectedCourse
                ? `Students enrolled in "${selectedCourse.title}"`
                : "All Enrollments"}
              {!loading && ` (${enrollments.length})`}
            </h2>

          </div>


          {loading && <p className="loading">Loading enrollments...</p>}


          {!loading && enrollments.length === 0 && (
            <p className="empty">
              {selectedCourseId === ""
                ? "No enrollments have been made yet."
                : "No students are enrolled in this course yet."}
            </p>
          )}


          {!loading && enrollments.length > 0 && (
            <div className="table-wrapper">

              <table className="table">

                <thead>

                  {selectedCourseId === "" ? (

                    /* ---------- All enrollments ---------- */
                    <tr>
                      <th>Student</th>
                      <th>Username</th>
                      <th>Course</th>
                      <th>Category</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th>Enrolled On</th>
                      <th className="table-actions-column">Actions</th>
                    </tr>

                  ) : (

                    /* ---------- One course ---------- */
                    <tr>
                      <th>Student</th>
                      <th>Username</th>
                      <th>Enrolled On</th>
                      <th>Status</th>
                      <th className="table-actions-column">Actions</th>
                    </tr>

                  )}

                </thead>


                <tbody>

                  {enrollments.map((enrollment) => (

                    <tr key={enrollment.id}>

                      <td>{enrollment.full_name}</td>

                      <td>{enrollment.username}</td>


                      {/* These columns only exist in "all courses" mode */}
                      {selectedCourseId === "" && (
                        <>
                          <td>{enrollment.title}</td>
                          <td>{enrollment.category}</td>
                          <td>
                            <span className="tag tag-level">
                              {enrollment.level}
                            </span>
                          </td>
                          <td>
                            <span className={`tag tag-status tag-status-${enrollment.status}`}>
                              {enrollment.status}
                            </span>
                          </td>
                        </>
                      )}

                      <td>{formatDate(enrollment.enrolled_at)}</td>

                      {selectedCourseId !== "" && (
                        <td>
                          <span className={`tag tag-status tag-status-${enrollment.status}`}>
                            {enrollment.status}
                          </span>
                        </td>
                      )}

                      <td>
                        <div className="table-actions">
                          {enrollment.status === "pending" && (
                            <>
                              <button
                                type="button"
                                className="btn btn-small btn-primary"
                                onClick={() => handleStatusChange(enrollment, "approved")}
                                disabled={processingId === enrollment.id}
                              >
                                <FaCheck /> Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-small btn-danger"
                                onClick={() => handleStatusChange(
                                  enrollment,
                                  "rejected",
                                  rejectionReasons[enrollment.id] || ""
                                )}
                                disabled={processingId === enrollment.id}
                              >
                                <FaTimes /> Reject
                              </button>
                              <input
                                type="text"
                                className="input input-small"
                                placeholder="Rejection reason"
                                value={rejectionReasons[enrollment.id] || ""}
                                onChange={(event) => setRejectionReasons((current) => ({
                                  ...current,
                                  [enrollment.id]: event.target.value,
                                }))}
                              />
                            </>
                          )}
                          <button
                            type="button"
                            className="btn btn-small btn-danger"
                            onClick={() => handleDelete(enrollment)}
                          >
                            <FaTrash /> Remove
                          </button>
                        </div>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>

      <Footer />

    </>
  );
}

export default ManageEnrollments;
