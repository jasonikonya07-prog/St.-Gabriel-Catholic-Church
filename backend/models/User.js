import mongoose from "mongoose";
import { configureMongoSchema, objectIdStringDefault, optionalObjectId } from "../utils/mongooseModel.js";

const { Schema } = mongoose;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userRoles = ["user", "admin", "editor"];

const adminReference = {
  default: null,
  ref: "Admin",
  set: optionalObjectId,
  type: Schema.Types.ObjectId,
};

const userSchema = new Schema(
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
    emailVerified: {
      default: false,
      type: Boolean,
    },
    failedLoginAttempts: {
      default: 0,
      min: [0, "Failed login attempts cannot be negative."],
      type: Number,
    },
    fullName: {
      maxlength: [120, "Full name must be 120 characters or fewer."],
      minlength: [2, "Full name must be at least 2 characters."],
      required: [true, "Full name is required."],
      trim: true,
      type: String,
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
    password: {
      maxlength: [255, "Password is too long."],
      minlength: [8, "Password must be at least 8 characters."],
      required: [true, "Password is required."],
      type: String,
    },
    phone: {
      default: null,
      maxlength: [40, "Phone number must be 40 characters or fewer."],
      trim: true,
      type: String,
    },
    role: {
      default: "user",
      enum: userRoles,
      index: true,
      required: true,
      type: String,
    },
    updatedBy: adminReference,
  },
  {
    collection: "users",
    timestamps: true,
  },
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

configureMongoSchema(userSchema, { hashPassword: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export { userRoles };
export default User;
