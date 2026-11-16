import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/notifications?page=${page}&limit=10`);

      setNotifications(response.data.notifications || []);
      setPagination({
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 10,
        total: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.totalPages || 1,
      });
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || "Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(1);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
    } catch (markError) {
      console.error(markError);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true }))
      );
    } catch (markError) {
      console.error(markError);
    }
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) {
      return;
    }

    loadNotifications(nextPage);
  };

  return (
    <>
      <Navbar />

      <div className="container notifications-page">
        <div className="page-header">
          <div>
            <h1>Notifications</h1>
            <p className="page-subtitle">
              Stay updated on course and enrollment changes.
            </p>
          </div>

          <button type="button" className="btn btn-outline-dark" onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        </div>

        <section className="section-card">
          <div className="section-card-header">
            <h2>Inbox</h2>
            <span className="result-count">{pagination.total} notifications</span>
          </div>

          {error && <p className="error">{error}</p>}

          {loading && <p className="loading">Loading notifications...</p>}

          {!loading && notifications.length === 0 && !error && (
            <p className="empty">You do not have any notifications yet.</p>
          )}

          {!loading && notifications.length > 0 && (
            <div className="notification-list">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`notification-item ${notification.is_read ? "read" : "unread"}`}
                >
                  <div className="notification-main">
                    <div className="notification-topline">
                      <span className="notification-type">{notification.notification_type}</span>
                      {!notification.is_read && <span className="notification-dot" aria-label="Unread" />}
                    </div>

                    <h3>{notification.title}</h3>
                    <p>{notification.message}</p>

                    <div className="notification-meta">
                      <span>{formatDate(notification.created_at)}</span>
                      {notification.internal_link && (
                        <Link to={notification.internal_link} className="notification-link">
                          Open
                        </Link>
                      )}
                    </div>
                  </div>

                  {!notification.is_read && (
                    <button
                      type="button"
                      className="btn btn-outline btn-small"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      Mark read
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-outline-dark btn-small"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </button>

              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                className="btn btn-outline-dark btn-small"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </>
  );
}

export default Notifications;
