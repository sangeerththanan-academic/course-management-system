import { Link } from "react-router-dom";
import { FaEye } from "react-icons/fa";

function getAvailabilityDisplay(course) {
  const enrolledCount = Number(course?.enrolled_count ?? 0);
  const maxStudents = course?.max_students === null || course?.max_students === undefined
    ? null
    : Number(course.max_students);

  if (maxStudents === null) {
    return "Unlimited";
  }

  if (course?.is_full) {
    return "Course Full";
  }

  return `${enrolledCount} / ${maxStudents} students`;
}

function CourseCard({ course }) {

  return (

    <article className="course-card">

      <img
        src={course.image}
        alt={course.title}
        className="course-card-image"
        loading="lazy"
      />


      <div className="course-card-body">

        <div className="course-card-tags">
          <span className="tag tag-category">
            {course.category}
          </span>

          <span className="tag tag-level">
            {course.level}
          </span>
        </div>


        <h3 className="course-card-title">
          {course.title}
        </h3>


        <p className="course-card-summary">
          {course.description?.slice(0, 110)}
          {course.description?.length > 110 ? "..." : ""}
        </p>


        <ul className="course-card-meta">
          <li>
            <strong>Duration:</strong> {course.duration}
          </li>

          <li>
            <strong>Price:</strong> Rs. {course.price}
          </li>

          <li>
            <strong>Availability:</strong> {getAvailabilityDisplay(course)}
          </li>
        </ul>


        <Link
          to={`/courses/${course.id}`}
          className="btn btn-primary btn-block"
        >
          <FaEye />
          View Details
        </Link>

      </div>

    </article>
  );
}

export default CourseCard;
