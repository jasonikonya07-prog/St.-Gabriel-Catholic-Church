import mongoose from "mongoose";
import { configureMongoSchema, objectIdStringDefault, optionalObjectId } from "../utils/mongooseModel.js";

const { Schema } = mongoose;
const actorTypes = ["admin", "user", "system", "public"];

const adminReference = {
  default: null,
  ref: "Admin",
  set: optionalObjectId,
  type: Schema.Types.ObjectId,
};

const auditLogSchema = new Schema(
  {
    id: {
      default: objectIdStringDefault,
      immutable: true,
      required: true,
      type: String,
      unique: true,
    },
    action: {
      index: true,
      maxlength: [120, "Audit action must be 120 characters or fewer."],
      required: [true, "Audit action is required."],
      trim: true,
      type: String,
    },
    actorEmail: {
      default: null,
      index: true,
      lowercase: true,
      maxlength: [160, "Actor email must be 160 characters or fewer."],
      trim: true,
      type: String,
    },
    actorId: {
      default: null,
      index: true,
      maxlength: [80, "Actor ID must be 80 characters or fewer."],
      trim: true,
      type: String,
    },
    actorType: {
      default: "system",
      enum: actorTypes,
      index: true,
      required: true,
      type: String,
    },
    createdBy: adminReference,
    description: {
      default: null,
      maxlength: [500, "Description must be 500 characters or fewer."],
      trim: true,
      type: String,
    },
    entity: {
      default: null,
      index: true,
      maxlength: [80, "Entity must be 80 characters or fewer."],
      trim: true,
      type: String,
    },
    entityId: {
      default: null,
      maxlength: [80, "Entity ID must be 80 characters or fewer."],
      trim: true,
      type: String,
    },
    ipAddress: {
      default: null,
      index: true,
      maxlength: [64, "IP address must be 64 characters or fewer."],
      trim: true,
      type: String,
    },
    metadata: {
      default: null,
      type: String,
    },
    module: {
      default: "system",
      index: true,
      maxlength: [80, "Audit module must be 80 characters or fewer."],
      required: [true, "Audit module is required."],
      trim: true,
      type: String,
    },
    updatedBy: adminReference,
    userAgent: {
      default: null,
      maxlength: [500, "User agent must be 500 characters or fewer."],
      trim: true,
      type: String,
    },
  },
  {
    collection: "audit_logs",
    timestamps: true,
  },
);

auditLogSchema.index({ actorType: 1, actorId: 1, createdAt: -1 });
auditLogSchema.index({ actorEmail: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

configureMongoSchema(auditLogSchema);

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export { actorTypes };
export default AuditLog;
