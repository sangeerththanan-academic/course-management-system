import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBell,
  FaBook,
  FaChartBar,
  FaHistory,
  FaHome,
  FaSignInAlt,
  FaSignOutAlt,
  FaTachometerAlt,
  FaTimes,
  FaUser,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa";

import api from "../services/api";
import { clearAuth, getUser, isLoggedIn } from "../services/auth";


function Navbar() {

  const navigate = useNavigate();
  const location = useLocation();

  // Mobile menu open / closed
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Read the current user from localStorage on every render
  const loggedIn = isLoggedIn();
  const user = getUser();

  useEffect(() => {
    if (!loggedIn || !user) {
      setUnreadCount(0);
      return undefined;
    }

    let cancelled = false;

    const fetchUnreadCount = async () => {
      try {
        const response = await api.get("/notifications/unread-count");

        if (!cancelled) {
          setUnreadCount(response.data.unreadCount || 0);
        }
      } catch (error) {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    };

    fetchUnreadCount();
    const intervalId = window.setInterval(fetchUnreadCount, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [loggedIn, user?.id]);

  // Close the mobile menu whenever a link is clicked
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {

    // Remove token + user from localStorage
    clearAuth();
    setUnreadCount(0);

    closeMenu();

    // Send the user back to the public home page
    navigate("/");
  };

  // NavLink gives us isActive so we can highlight the current page
  const linkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (

    <header className="navbar">

      <div className="navbar-inner">

        {/* Brand / logo */}
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="navbar-brand-mark">CMS</span>
          <span className="navbar-brand-text">
            Course Management System
          </span>
        </Link>


        {/* Mobile hamburger button */}
        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>


        {/* Navigation links */}
        <nav className={menuOpen ? "navbar-links open" : "navbar-links"}>

          {/* ---------- Always visible ---------- */}

          <NavLink to="/" end className={linkClass} onClick={closeMenu}>
            <FaHome />
            Home
          </NavLink>

          <NavLink to="/courses" className={linkClass} onClick={closeMenu}>
            <FaBook />
            Courses
          </NavLink>



          {/* ---------- Student menu ---------- */}

          {loggedIn && user?.role === "student" && (
            <>
              <NavLink to="/student" className={linkClass} onClick={closeMenu}>
                <FaUserGraduate />
                Student Area
              </NavLink>

              <NavLink
                to="/my-enrollments"
                className={linkClass}
                onClick={closeMenu}
              >
                <FaBook />
                My Enrollments
              </NavLink>
            </>
          )}

          {loggedIn && (
            <NavLink to="/notifications" className={linkClass} onClick={closeMenu}>
              <span className="notification-bell-wrap">
                <FaBell />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                )}
              </span>
              Notifications
            </NavLink>
          )}


          {/* ---------- Admin menu ---------- */}

          {loggedIn && user?.role === "admin" && (
            <>
              <NavLink to="/admin" end className={linkClass} onClick={closeMenu}>
                <FaTachometerAlt />
                Dashboard
              </NavLink>

              <NavLink
                to="/admin/courses"
                className={linkClass}
                onClick={closeMenu}
              >
                <FaChartBar />
                Manage Courses
              </NavLink>

              <NavLink
                to="/admin/enrollments"
                className={linkClass}
                onClick={closeMenu}
              >
                <FaUsers />
                Manage Enrollments
              </NavLink>

              <NavLink
                to="/admin/audit-logs"
                className={linkClass}
                onClick={closeMenu}
              >
                <FaHistory />
                Audit Logs
              </NavLink>
            </>
          )}


          {/* ---------- Logged in: user name + logout ---------- */}

          {loggedIn ? (

            <div className="navbar-user">

              <span className="navbar-username">
                <FaUser />
                <span className="role-badge">{user?.role}</span>
                {user?.full_name || user?.username}
              </span>

              <button
                type="button"
                className="btn btn-outline"
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                Logout
              </button>

            </div>

          ) : (

            /* ---------- Logged out: login button ---------- */
            
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className="btn btn-primary"
              onClick={closeMenu}
            >
              <FaSignInAlt />
              Login
            </Link>

          )}

        </nav>

      </div>

    </header>
  );
}

export default Navbar;

