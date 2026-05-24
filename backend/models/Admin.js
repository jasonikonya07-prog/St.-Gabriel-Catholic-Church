import mongoose from "mongoose";
import { configureMongoSchema, objectIdStringDefault, optionalObjectId } from "../utils/mongooseModel.js";

const { Schema } = mongoose;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const adminRoles = ["super_admin", "admin", "editor"];

const adminReference = {
  default: null,
  ref: "Admin",
  set: optionalObjectId,
  type: Schema.Types.ObjectId,
};

const adminSchema = new Schema(
  {
    id: {
      default: objectIdStringDefault,
      immutable: true,
      required: true,
      type: String,
      unique: true,
    },
    createdBy: adminReference,
    email: {
      lowercase: true,
      maxlength: [160, "Email must be 160 characters or fewer."],
      required: [true, "Email is required."],
      trim: true,
      type: String,
      unique: true,
      validate: {
        message: "Please enter a valid email address.",
        validator: (value) => emailRegex.test(String(value || "")),
      },
    },
    failedLoginAttempts: {
      default: 0,
      min: [0, "Failed login attempts cannot be negative."],
      type: Number,
    },
    isActive: {
      default: true,
      index: true,
      type: Boolean,
    },
    lastLogin: {
      default: null,
      type: Date,
    },
    lockUntil: {
      default: null,
      index: true,
      type: Date,
    },
    name: {
      maxlength: [120, "Admin name must be 120 characters or fewer."],
      minlength: [2, "Admin name must be at least 2 characters."],
      required: [true, "Admin name is required."],
      trim: true,
      type: String,
    },
    password: {
      maxlength: [255, "Password is too long."],
      minlength: [8, "Password must be at least 8 characters."],
      required: [true, "Password is required."],
      type: String,
    },
    role: {
      default: "admin",
      enum: adminRoles,
      index: true,
      required: true,
      type: String,
    },
    updatedBy: adminReference,
  },
  {
    collection: "admins",
    timestamps: true,
  },
);

adminSchema.index({ role: 1, isActive: 1 });
adminSchema.index({ createdAt: -1 });

configureMongoSchema(adminSchema, { hashPassword: true });

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export { adminRoles };
export default Admin;
