import { useEffect, useState } from "react";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CourseCard from "../components/CourseCard";

function matchesCourseId(courseId, searchTerm) {
  const id = String(courseId ?? "").trim().toLowerCase();
  const term = searchTerm.trim().toLowerCase();

  if (!term || id === term) {
    return true;
  }

  const formattedCourseId = term.match(/^c(\d+)$/);
  return Boolean(
    formattedCourseId &&
    Number.isFinite(Number(id)) &&
    Number(id) === Number(formattedCourseId[1])
  );
}

function parseDurationToDays(duration) {
  const match = String(duration ?? "").trim().toLowerCase().match(
    /^(\d+(?:\.\d+)?)\s*(hours?|days?|weeks?|months?|years?)?/
  );

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const value = Number(match[1]);
  const unit = match[2] || "days";

  if (unit.startsWith("hour")) return value / 24;
  if (unit.startsWith("week")) return value * 7;
  if (unit.startsWith("month")) return value * 30;
  if (unit.startsWith("year")) return value * 365;
  return value;
}

function Courses() {
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- Filters ----------
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  // ---------- Load courses from the backend ----------
  useEffect(() => {
    const getCourses = async () => {
      try {
        const response = await api.get("/courses");

        // Backend returns the course array inside "courses"
        setCourses(response.data.courses || []);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load courses"
        );
      } finally {
        setLoading(false);
      }
    };

    getCourses();
  }, []);

  // ---------- Build category list from loaded courses ----------
  const categories = [
    "All",
    ...new Set(
      courses
        .map((course) => course.category)
        .filter(Boolean)
    ),
  ];

  // ---------- Available levels ----------
  const levels = [
    "All",
    "Beginner",
    "Intermediate",
    "Advanced",
  ];

  const formatAvailability = (course) => {
    if (course.max_students === null || course.max_students === undefined) {
      return "Unlimited";
    }

    if (course.is_full) {
      return "Course Full";
    }

    return `${course.enrolled_count ?? 0} / ${course.max_students} students`;
  };

  // ---------- Apply all filters using AND logic ----------
  const filteredCourses = courses.filter((course) => {
    // Safely convert potentially null/undefined values to strings
    const title = String(course.title || "");
    const courseId = String(course.id || "");
    const category = String(course.category || "");
    const level = String(course.level || "");
    const description = String(course.description || "");
    const duration = String(course.duration || "");

    const search = searchText.trim().toLowerCase();

    // Search title, category, level, description and duration
    const matchesSearch =
      !search ||
      matchesCourseId(courseId, search) ||
      title.toLowerCase().includes(search) ||
      category.toLowerCase().includes(search) ||
      level.toLowerCase().includes(search) ||
      description.toLowerCase().includes(search) ||
      duration.toLowerCase().includes(search);

    // Category filter
    const matchesCategory =
      selectedCategory === "All" ||
      category === selectedCategory;

    // Level filter
    const matchesLevel =
      selectedLevel === "All" ||
      level === selectedLevel;

    // Convert course price to a number safely
    const coursePrice = Number(course.price);

    // Minimum price filter
    const matchesMinPrice =
      minPrice === "" ||
      (!Number.isNaN(coursePrice) &&
        coursePrice >= Number(minPrice));

    // Maximum price filter
    const matchesMaxPrice =
      maxPrice === "" ||
      (!Number.isNaN(coursePrice) &&
        coursePrice <= Number(maxPrice));

    // ALL filters must match
    return (
      matchesSearch &&
      matchesCategory &&
      matchesLevel &&
      matchesMinPrice &&
      matchesMaxPrice
    );
  });

  const sortedCourses = [...filteredCourses].sort((firstCourse, secondCourse) => {
    if (!sortBy) {
      return 0;
    }

    const firstValue = sortBy === "price"
      ? Number(firstCourse.price)
      : parseDurationToDays(firstCourse.duration);
    const secondValue = sortBy === "price"
      ? Number(secondCourse.price)
      : parseDurationToDays(secondCourse.duration);
    const difference = firstValue - secondValue;

    return sortDirection === "desc" ? -difference : difference;
  });

  // ---------- Check whether any filter is active ----------
  const hasActiveFilters =
    searchText.trim() !== "" ||
    selectedCategory !== "All" ||
    selectedLevel !== "All" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    sortBy !== "" ||
    sortDirection !== "asc";

  // ---------- Clear all filters ----------
  const clearAllFilters = () => {
    setSearchText("");
    setSelectedCategory("All");
    setSelectedLevel("All");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("");
    setSortDirection("asc");
  };

  return (
    <>
      <Navbar />

      <div className="container">
        <div className="page-header">
          <div>
            <h1>Our Courses</h1>
            <p className="page-subtitle">
              Browse the full catalogue and find a course
              that suits your needs.
            </p>
          </div>
        </div>

        {/* ---------- Filters ---------- */}

        {!loading && !error && courses.length > 0 && (
          <div className="filter-bar">
            {/* Search */}
            <div className="filter-field filter-search-field">
              <label htmlFor="courseSearch">Search courses</label>
              <input
                id="courseSearch"
                type="text"
                className="input"
                placeholder="Search by course ID, title, category, level, description or duration..."
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
              />
            </div>

            {/* Category */}
            <div className="filter-field">
              <label htmlFor="categoryFilter">Category</label>
              <select
                id="categoryFilter"
                className="input"
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(event.target.value)
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div className="filter-field">
              <label htmlFor="levelFilter">Level</label>
              <select
                id="levelFilter"
                className="input"
                value={selectedLevel}
                onChange={(event) =>
                  setSelectedLevel(event.target.value)
                }
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level === "All" ? "All Levels" : level}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum price */}
            <div className="filter-field price-field">
              <label htmlFor="minimumPrice">Minimum price</label>
              <input
                id="minimumPrice"
                type="number"
                className="input"
                placeholder="Minimum price"
                min="0"
                value={minPrice}
                onChange={(event) =>
                  setMinPrice(event.target.value)
                }
              />
            </div>

            {/* Price sorting */}
            <div className="filter-field">
              <label htmlFor="sortBy">Sort by</label>
              <select
                id="sortBy"
                className="input"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="">Sort by...</option>
                <option value="price">Price</option>
                <option value="duration">Duration</option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="sortDirection">Sort direction</label>
              <select
                id="sortDirection"
                className="input"
                value={sortDirection}
                onChange={(event) => setSortDirection(event.target.value)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            {/* Maximum price */}
            <div className="filter-field price-field">
              <label htmlFor="maximumPrice">Maximum price</label>
              <input
                id="maximumPrice"
                type="number"
                className="input"
                placeholder="Maximum price"
                min="0"
                value={maxPrice}
                onChange={(event) =>
                  setMaxPrice(event.target.value)
                }
              />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                type="button"
                className="clear-filter-btn"
                onClick={clearAllFilters}
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* ---------- Active Filter Chips ---------- */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          hasActiveFilters && (
            <div className="active-filters">
              <span className="active-filters-label">
                Active filters:
              </span>

              {searchText.trim() !== "" && (
                <span className="filter-chip">
                  Search: {searchText}
                </span>
              )}

              {selectedCategory !== "All" && (
                <span className="filter-chip">
                  Category: {selectedCategory}
                </span>
              )}

              {selectedLevel !== "All" && (
                <span className="filter-chip">
                  Level: {selectedLevel}
                </span>
              )}

              {minPrice !== "" && (
                <span className="filter-chip">
                  Min price: {minPrice}
                </span>
              )}

              {maxPrice !== "" && (
                <span className="filter-chip">
                  Max price: {maxPrice}
                </span>
              )}
            </div>
          )}

        {/* ---------- Loading state ---------- */}

        {loading && (
          <p className="loading">
            Loading courses...
          </p>
        )}

        {/* ---------- Error state ---------- */}

        {error && !loading && (
          <p className="error">{error}</p>
        )}

        {/* ---------- No courses exist ---------- */}

        {!loading &&
          !error &&
          courses.length === 0 && (
            <p className="empty">
              There are no courses available at the moment.
            </p>
          )}

        {/* ---------- Courses exist but filters match nothing ---------- */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          filteredCourses.length === 0 && (
            <p className="empty">
              No courses match your filters. Try changing or
              clearing your search criteria.
            </p>
          )}

        {/* ---------- Result count and course list ---------- */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          sortedCourses.length > 0 && (
            <>
              <p className="result-count">
                Showing {sortedCourses.length} of{" "}
                {courses.length} courses
                {sortBy && (
                  <span>
                    {" "}| Sorted by {sortBy} ({sortDirection === "asc" ? "ascending" : "descending"})
                  </span>
                )}
              </p>

              <div className="course-grid">
                {sortedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                  />
                ))}
              </div>
            </>
          )}
      </div>

      <Footer />
    </>
  );
}

export default Courses;