const AuditLog = require("../models/auditModel");

const getClientIp = (req) => {
  const forwardedHeader = req?.headers?.["x-forwarded-for"];

  if (Array.isArray(forwardedHeader) && forwardedHeader.length > 0) {
    return forwardedHeader[0].split(",")[0].trim();
  }

  if (typeof forwardedHeader === "string") {
    return forwardedHeader.split(",")[0].trim();
  }

  return req?.ip || req?.socket?.remoteAddress || null;
};

const createAuditRecord = async ({
  req,
  action,
  entityType,
  entityId,
  previousData = null,
  newData = null,
}) => {
  try {
    if (!req?.user || !req.user.id || !req.user.username || !req.user.role) {
      return false;
    }

    await AuditLog.create({
      actor_id: Number(req.user.id),
      actor_username: req.user.username,
      actor_role: req.user.role,
      action,
      entity_type: entityType,
      entity_id: Number(entityId),
      previous_data: previousData,
      new_data: newData,
      ip_address: getClientIp(req),
    });

    return true;
  } catch (error) {
    console.error("Audit logging failed:", error.message);
    return false;
  }
};

module.exports = {
  createAuditRecord,
  auditFailurePolicy: "Audit failures are non-blocking and do not stop the main business operation.",
};
