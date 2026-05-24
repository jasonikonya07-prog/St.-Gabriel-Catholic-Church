import mongoose from "mongoose";
import { configureMongoSchema, objectIdStringDefault, optionalObjectId } from "../utils/mongooseModel.js";

const { Schema } = mongoose;

export const prayerCategories = ["Healing", "Family", "Thanksgiving", "Guidance", "Loss", "Private Request", "Other"];
export const prayerStatuses = ["pending", "prayed", "archived"];

const prayerRequestSchema = new Schema(
  {
    id: {
      default: objectIdStringDefault,
      immutable: true,
      required: true,
      type: String,
      unique: true,
    },
    adminNotes: {
      default: null,
      maxlength: [1000, "Admin notes must be 1000 characters or fewer."],
      trim: true,
      type: String,
    },
    category: {
      default: "Private Request",
      enum: prayerCategories,
      index: true,
      required: true,
      type: String,
    },
    contact: {
      maxlength: [160, "Contact must be 160 characters or fewer."],
      required: [true, "Contact is required."],
      trim: true,
      type: String,
    },
    createdBy: {
      default: null,
      ref: "User",
      set: optionalObjectId,
      type: Schema.Types.ObjectId,
    },
    fullName: {
      maxlength: [120, "Full name must be 120 characters or fewer."],
      minlength: [2, "Full name must be at least 2 characters."],
      required: [true, "Full name is required."],
      trim: true,
      type: String,
    },
    isPrivate: {
      default: true,
      index: true,
      type: Boolean,
    },
    message: {
      maxlength: [2000, "Prayer message must be 2000 characters or fewer."],
      minlength: [10, "Prayer message must be at least 10 characters."],
      required: [true, "Prayer message is required."],
      trim: true,
      type: String,
    },
    status: {
      default: "pending",
      enum: prayerStatuses,
      index: true,
      required: true,
      type: String,
    },
    updatedBy: {
      default: null,
      ref: "Admin",
      set: optionalObjectId,
      type: Schema.Types.ObjectId,
    },
    userId: {
      default: null,
      index: true,
      type: String,
    },
  },
  {
    collection: "prayer_requests",
    timestamps: true,
  },
);

prayerRequestSchema.index({ status: 1, createdAt: -1 });
prayerRequestSchema.index({ category: 1, status: 1 });
prayerRequestSchema.index({ isPrivate: 1, createdAt: -1 });
prayerRequestSchema.index({ userId: 1, createdAt: -1 });
prayerRequestSchema.index({ createdBy: 1, createdAt: -1 });
prayerRequestSchema.index({ fullName: "text", contact: "text", message: "text" });

configureMongoSchema(prayerRequestSchema);

const PrayerRequest = mongoose.models.PrayerRequest || mongoose.model("PrayerRequest", prayerRequestSchema);

export default PrayerRequest;
