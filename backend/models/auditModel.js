const db = require("../config/db");

const normalizeJsonField = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }

  return value;
};

const AuditLog = {
  async create(record) {
    const {
      actor_id,
      actor_username,
      actor_role,
      action,
      entity_type,
      entity_id,
      previous_data,
      new_data,
      ip_address,
    } = record;

    const [result] = await db.execute(
      `INSERT INTO audit_logs
       (actor_id, actor_username, actor_role, action, entity_type, entity_id, previous_data, new_data, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actor_id,
        actor_username,
        actor_role,
        action,
        entity_type,
        entity_id,
        previous_data === null || previous_data === undefined
          ? null
          : JSON.stringify(previous_data),
        new_data === null || new_data === undefined
          ? null
          : JSON.stringify(new_data),
        ip_address,
      ]
    );

    return result.insertId;
  },

  async getAll(options = {}) {
    const {
      entityType = null,
      entityId = null,
      actor = null,
      action = null,
      fromDate = null,
      toDate = null,
      page = 1,
      limit = 20,
    } = options;

    const conditions = [];
    const params = [];

    if (entityType) {
      conditions.push("al.entity_type = ?");
      params.push(entityType);
    }

    if (entityId) {
      conditions.push("al.entity_id = ?");
      params.push(Number(entityId));
    }

    if (actor) {
      const actorId = Number(actor);
      if (!Number.isNaN(actorId)) {
        conditions.push("(al.actor_username = ? OR al.actor_id = ?)");
        params.push(actor, actorId);
      } else {
        conditions.push("al.actor_username = ?");
        params.push(actor);
      }
    }

    if (action) {
      conditions.push("al.action = ?");
      params.push(action);
    }

    if (fromDate) {
      conditions.push("al.created_at >= ?");
      params.push(fromDate);
    }

    if (toDate) {
      conditions.push("al.created_at <= ?");
      params.push(toDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limitValue = Math.max(1, Number(limit) || 20);
    const pageValue = Math.max(1, Number(page) || 1);
    const offset = (pageValue - 1) * limitValue;

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM audit_logs al
       ${whereClause}`,
      params
    );

    const [rows] = await db.execute(
      `SELECT
          al.id,
          al.actor_id,
          al.actor_username,
          al.actor_role,
          al.action,
          al.entity_type,
          al.entity_id,
          al.previous_data,
          al.new_data,
          al.ip_address,
          al.created_at
       FROM audit_logs al
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitValue, offset]
    );

    const total = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limitValue));

    return {
      logs: rows.map((row) => ({
        ...row,
        previous_data: normalizeJsonField(row.previous_data),
        new_data: normalizeJsonField(row.new_data),
      })),
      total,
      page: pageValue,
      limit: limitValue,
      totalPages,
    };
  },
};

module.exports = AuditLog;
