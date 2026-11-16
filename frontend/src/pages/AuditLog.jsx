import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import { getUser } from "../services/auth";

const defaultFilters = {
  entityType: "",
  entityId: "",
  actor: "",
  action: "",
  fromDate: "",
  toDate: "",
};

const formatJson = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
};

function AuditLog() {
  const user = getUser();
  const [pendingFilters, setPendingFilters] = useState(defaultFilters);
  const [activeFilters, setActiveFilters] = useState(defaultFilters);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAuditLogs = async (page = 1, currentFilters = activeFilters) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (currentFilters.entityType) params.set("entityType", currentFilters.entityType);
      if (currentFilters.entityId) params.set("entityId", currentFilters.entityId);
      if (currentFilters.actor) params.set("actor", currentFilters.actor);
      if (currentFilters.action) params.set("action", currentFilters.action);
      if (currentFilters.fromDate) params.set("fromDate", currentFilters.fromDate);
      if (currentFilters.toDate) params.set("toDate", currentFilters.toDate);
      params.set("page", String(page));
      params.set("limit", "10");

      const response = await api.get(`/audit-logs?${params.toString()}`);

      setLogs(response.data.logs || []);
      setPagination({
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 10,
        total: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.totalPages || 1,
      });
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || "Failed to load audit logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") {
      return;
    }

    loadAuditLogs(1, defaultFilters);
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setPendingFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    const nextFilters = { ...pendingFilters };
    setActiveFilters(nextFilters);
    setPagination((current) => ({ ...current, page: 1 }));
    loadAuditLogs(1, nextFilters);
  };

  const resetFilters = () => {
    const nextFilters = { ...defaultFilters };
    setPendingFilters(nextFilters);
    setActiveFilters(nextFilters);
    setPagination((current) => ({ ...current, page: 1 }));
    loadAuditLogs(1, nextFilters);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) {
      return;
    }

    setPagination((current) => ({ ...current, page: nextPage }));
    loadAuditLogs(nextPage, activeFilters);
  };

  if (user?.role !== "admin") {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="section-card">
            <h2>Access denied</h2>
            <p className="error">Only administrators can access audit logs.</p>
            <Link to="/" className="btn btn-primary">Go home</Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="container audit-page">
        <div className="page-header">
          <div>
            <h1>Audit Logs</h1>
            <p className="page-subtitle">
              Review administrative actions and trace changes to courses and enrollments.
            </p>
          </div>

          <Link to="/admin" className="btn btn-outline-dark">
            Back to dashboard
          </Link>
        </div>

        <section className="section-card">
          <div className="section-card-header">
            <h2>Filters</h2>
          </div>

          <form className="audit-filters" onSubmit={applyFilters}>
            <div className="filter-grid">
              <div className="form-group">
                <label htmlFor="entityType">Entity type</label>
                <input
                  id="entityType"
                  className="input"
                  name="entityType"
                  value={pendingFilters.entityType}
                  onChange={handleFilterChange}
                  placeholder="course / enrollment"
                />
              </div>

              <div className="form-group">
                <label htmlFor="entityId">Entity ID</label>
                <input
                  id="entityId"
                  className="input"
                  name="entityId"
                  type="number"
                  value={pendingFilters.entityId}
                  onChange={handleFilterChange}
                  placeholder="e.g. 12"
                />
              </div>

              <div className="form-group">
                <label htmlFor="actor">Actor</label>
                <input
                  id="actor"
                  className="input"
                  name="actor"
                  value={pendingFilters.actor}
                  onChange={handleFilterChange}
                  placeholder="username or ID"
                />
              </div>

              <div className="form-group">
                <label htmlFor="action">Action</label>
                <input
                  id="action"
                  className="input"
                  name="action"
                  value={pendingFilters.action}
                  onChange={handleFilterChange}
                  placeholder="course_created"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fromDate">From date</label>
                <input
                  id="fromDate"
                  className="input"
                  name="fromDate"
                  type="date"
                  value={pendingFilters.fromDate}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="toDate">To date</label>
                <input
                  id="toDate"
                  className="input"
                  name="toDate"
                  type="date"
                  value={pendingFilters.toDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Apply filters</button>
              <button type="button" className="btn btn-outline-dark" onClick={resetFilters}>Reset</button>
            </div>
          </form>
        </section>

        <section className="section-card">
          <div className="section-card-header">
            <h2>Audit trail</h2>
            <span className="result-count">{pagination.total} records</span>
          </div>

          {error && <p className="error">{error}</p>}

          {loading && <p className="loading">Loading audit logs...</p>}

          {!loading && logs.length === 0 && !error && (
            <p className="empty">No audit entries match the current filters.</p>
          )}

          {!loading && logs.length > 0 && (
            <>
              <div className="table-wrapper">
                <table className="table audit-table">
                  <thead>
                    <tr>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Entity ID</th>
                      <th>Date</th>
                      <th>Before</th>
                      <th>After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <strong>{log.actor_username}</strong>
                          <div className="audit-meta">{log.actor_role}</div>
                          <div className="audit-meta">{log.actor_id}</div>
                        </td>
                        <td>{log.action}</td>
                        <td>{log.entity_type}</td>
                        <td>{log.entity_id}</td>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                        <td className="audit-data-cell">
                          <pre>{formatJson(log.previous_data)}</pre>
                        </td>
                        <td className="audit-data-cell">
                          <pre>{formatJson(log.new_data)}</pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button
                  type="button"
                  className="btn btn-outline-dark btn-small"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
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
            </>
          )}
        </section>
      </div>

      <Footer />
    </>
  );
}

export default AuditLog;
