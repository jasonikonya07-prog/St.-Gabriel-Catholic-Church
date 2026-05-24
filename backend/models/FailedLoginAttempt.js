import { createMongoModel } from "../utils/mongooseModel.js";

const FailedLoginAttempt = createMongoModel(
  "FailedLoginAttempt",
  {
    email: {
      lowercase: true,
      maxlength: 160,
      required: true,
      trim: true,
      type: String,
    },
    ipAddress: {
      default: null,
      maxlength: 64,
      trim: true,
      type: String,
    },
    reason: {
      maxlength: 120,
      required: true,
      trim: true,
      type: String,
    },
    scope: {
      enum: ["admin", "user"],
      required: true,
      type: String,
    },
    userAgent: {
      default: null,
      maxlength: 500,
      trim: true,
      type: String,
    },
  },
  {
    collection: "failed_login_attempts",
    indexes: [
      { fields: { scope: 1 } },
      { fields: { email: 1 } },
      { fields: { ipAddress: 1 } },
      { fields: { createdAt: 1 } },
    ],
  },
);

export default FailedLoginAttempt;
