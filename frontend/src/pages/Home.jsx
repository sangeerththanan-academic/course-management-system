import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaBolt,
  FaChartLine,
  FaEye,
  FaSearch,
  FaSignInAlt,
  FaTools,
} from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CourseCard from "../components/CourseCard";

import heroImage from "../assets/hero.png";

function formatAvailability(course) {
  if (course.max_students === null || course.max_students === undefined) {
    return "Unlimited";
  }

  if (course.is_full) {
    return "Course Full";
  }

  return `${course.enrolled_count ?? 0} / ${course.max_students} students`;
}

function Home() {

  const [courses, setCourses] = useState([]);

  const [stats, setStats] = useState({
    courseCount: 0,
    studentCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    const loadHomeData = async () => {

      try {

        // Both requests are independent, so we fire them together.
        const [coursesResponse, statsResponse] = await Promise.all([
          api.get("/courses"),
          api.get("/courses/stats"),
        ]);

        setCourses(coursesResponse.data.courses);

        setStats({
          courseCount: statsResponse.data.courseCount,
          studentCount: statsResponse.data.studentCount,
        });

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Could not load data from the server. Is the backend running?"
        );

      } finally {

        setLoading(false);

      }
    };

    loadHomeData();

  }, []);




  // Show only the first 3 courses as a preview on the landing page.
  const previewCourses = courses.slice(0, 3);

  // Count the DIFFERENT levels we actually got from the backend.
  const levelCount = new Set(courses.map((course) => course.level)).size;


  return (

    <>
      <Navbar />

      {/* Hero section */}

      <section className="hero">

        <div className="hero-inner">

          <div className="hero-text">

            <p className="hero-eyebrow">
              Learn. Build. Get Certified.
            </p>

            <h1 className="hero-title">
              Grow your career with our
              <span className="hero-highlight"> practical IT courses</span>
            </h1>

            <p className="hero-subtitle">
              A complete course management platform where students browse
              and enroll in courses, and administrators manage the whole
              catalogue from one place.
            </p>

            <div className="hero-actions">

              <Link to="/courses" className="btn btn-primary btn-lg">
                <FaSearch />
                Browse Courses
              </Link>

              <Link to="/login" className="btn btn-outline-dark btn-lg">
                <FaSignInAlt />
                Login
              </Link>

            </div>

          </div>


          <div className="hero-image-wrapper">
            <img
              src={heroImage}
              alt="Students learning web development"
              className="hero-image"
            />
          </div>

        </div>

      </section>


      {/* Statistics (GET /api/courses/stats) */}

      <section className="stats-strip">

        <div className="stats-inner">

          <div className="stat-card">

            <span className="stat-value">
              {loading ? "..." : stats.courseCount}
            </span>

            <span className="stat-label">
              Courses Available
            </span>

          </div>


          <div className="stat-card">

            <span className="stat-value">
              {loading ? "..." : stats.studentCount}
            </span>

            <span className="stat-label">
              Registered Students
            </span>

          </div>


          <div className="stat-card">

            <span className="stat-value">
              {loading ? "..." : levelCount}
            </span>

            <span className="stat-label">
              Skill Levels
            </span>

          </div>


          <div className="stat-card">

            <span className="stat-value">24/7</span>

            <span className="stat-label">
              Online Access
            </span>

          </div>

        </div>

      </section>


      {/* Short introduction */}

      <section className="section">

        <div className="container">

          <h2 className="section-title">
            Why choose our platform?
          </h2>

          <p className="section-subtitle">
            Everything you need to plan, enroll and track your learning
            in one simple system.
          </p>


          <div className="feature-grid">

            <div className="feature-card">
              <span className="feature-icon"><FaBook /></span>
              <h3>Industry Ready Courses</h3>
              <p>
                Courses cover frontend, backend, databases and full stack
                development with real project work.
              </p>
            </div>


            <div className="feature-card">
              <span className="feature-icon"><FaBolt /></span>
              <h3>Enroll in One Click</h3>
              <p>
                Logged in students can enroll in any course instantly
                without any paperwork.
              </p>
            </div>


            <div className="feature-card">
              <span className="feature-icon"><FaChartLine /></span>
              <h3>Track Your Progress</h3>
              <p>
                See every course you have enrolled in and when you
                enrolled, all from your student area.
              </p>
            </div>


            <div className="feature-card">
              <span className="feature-icon"><FaTools /></span>
              <h3>Full Admin Control</h3>
              <p>
                Administrators can add, edit and remove courses and
                manage every student enrollment.
              </p>
            </div>

          </div>

          <div className="section-card" style={{ marginTop: "2rem" }}>
          <h3 className="section-title" style={{ marginBottom: "1rem" }}>Course availability</h3>
          <div className="course-grid">
            {previewCourses.map((course) => (
              <div key={course.id} className="course-card mini-availability-card">
                <div className="course-card-body">
                  <h3 className="course-card-title">{course.title}</h3>
                  <p className="course-card-summary">
                    <strong>Availability:</strong> {formatAvailability(course)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          </div>

        </div>

      </section>


      {/* Course preview (GET /api/courses) */}

      <section className="section section-alt">

        <div className="container">

          <h2 className="section-title">
            Popular Courses
          </h2>

          <p className="section-subtitle">
            A quick look at some of the courses available right now.
          </p>


          {loading && (
            <p className="loading">Loading courses...</p>
          )}


          {error && !loading && (
            <p className="error">{error}</p>
          )}


          {!loading && !error && previewCourses.length === 0 && (
            <p className="empty">
              No courses have been published yet. Please check back soon.
            </p>
          )}


          {!loading && !error && previewCourses.length > 0 && (

            <div className="course-grid">
              {previewCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

          )}


          <div className="center-actions">
            <Link to="/courses" className="btn btn-outline">
              <FaEye />
              View All Courses
            </Link>
          </div>

        </div>

      </section>



      {/* Call to action */}

      <section className="cta">

        <div className="container cta-inner">

          <h2>Ready to start learning?</h2>

          <p>
            Create your student account access by logging in and enroll
            in your first course today.
          </p>

          <div className="hero-actions">

            <Link to="/courses" className="btn btn-light btn-lg">
              <FaSearch />
              Explore Courses
            </Link>

            <Link to="/login" className="btn btn-outline-light btn-lg">
              <FaSignInAlt />
              Login Now
            </Link>

          </div>

        </div>

      </section>


      <Footer />

    </>
  );
}

export default Home;

