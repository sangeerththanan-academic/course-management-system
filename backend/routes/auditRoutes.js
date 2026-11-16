const express = require("express");

const router = express.Router();
const AuditLog = require("../models/auditModel");

const getAuditLogs = async (req, res) => {
  try {
    const {
      entityType,
      entityId,
      actor,
      action,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = req.query;

    const result = await AuditLog.getAll({
      entityType: entityType || null,
      entityId: entityId || null,
      actor: actor || null,
      action: action || null,
      fromDate: fromDate || null,
      toDate: toDate || null,
      page,
      limit,
    });

    res.status(200).json({
      message: "Audit logs retrieved successfully",
      logs: result.logs,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("Error retrieving audit logs:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

router.get("/", getAuditLogs);

module.exports = router;
