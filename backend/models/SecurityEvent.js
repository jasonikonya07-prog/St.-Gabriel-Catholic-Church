import mongoose from "mongoose";
import { configureMongoSchema, objectIdStringDefault, optionalObjectId } from "../utils/mongooseModel.js";

const { Schema } = mongoose;

export const securitySeverities = ["low", "medium", "high", "critical"];
export const securityActorTypes = ["admin", "user", "system", "public"];

const adminReference = {
  default: null,
  ref: "Admin",
  set: optionalObjectId,
  type: Schema.Types.ObjectId,
};

const securityEventSchema = new Schema(
  {
    id: {
      default: objectIdStringDefault,
      immutable: true,
      required: true,
      type: String,
      unique: true,
    },
    createdBy: adminReference,
    actorId: {
      default: null,
      index: true,
      maxlength: [80, "Actor ID must be 80 characters or fewer."],
      trim: true,
      type: String,
    },
    actorType: {
      default: "system",
      enum: securityActorTypes,
      index: true,
      required: true,
      type: String,
    },
    details: {
      default: null,
      type: Schema.Types.Mixed,
    },
    email: {
      default: null,
      index: true,
      lowercase: true,
      maxlength: [160, "Email must be 160 characters or fewer."],
      trim: true,
      type: String,
    },
    eventType: {
      index: true,
      maxlength: [120, "Event type must be 120 characters or fewer."],
      required: [true, "Event type is required."],
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
    module: {
      default: "security",
      index: true,
      maxlength: [80, "Security event module must be 80 characters or fewer."],
      trim: true,
      type: String,
    },
    severity: {
      default: "low",
      enum: securitySeverities,
      index: true,
      required: true,
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
    collection: "security_events",
    timestamps: true,
  },
);

securityEventSchema.index({ eventType: 1, createdAt: -1 });
securityEventSchema.index({ email: 1, createdAt: -1 });
securityEventSchema.index({ ipAddress: 1, createdAt: -1 });
securityEventSchema.index({ module: 1, createdAt: -1 });
securityEventSchema.index({ actorType: 1, actorId: 1, createdAt: -1 });
securityEventSchema.index({ severity: 1, createdAt: -1 });
securityEventSchema.index({ createdAt: -1 });

configureMongoSchema(securityEventSchema);

const SecurityEvent = mongoose.models.SecurityEvent || mongoose.model("SecurityEvent", securityEventSchema);

export default SecurityEvent;
