import mongoose from "mongoose";
import { configureMongoSchema, objectIdStringDefault, optionalObjectId } from "../utils/mongooseModel.js";

const { Schema } = mongoose;
const urlRegex = /^https?:\/\/\S+$/i;

export const announcementCategories = ["Important", "Mass Update", "Youth", "Charity", "Parish News"];

const adminReference = {
  default: null,
  ref: "Admin",
  set: optionalObjectId,
  type: Schema.Types.ObjectId,
};

const announcementSchema = new Schema(
  {
    id: {
      default: objectIdStringDefault,
      immutable: true,
      required: true,
      type: String,
      unique: true,
    },
    category: {
      default: "Parish News",
      enum: announcementCategories,
      index: true,
      required: true,
      type: String,
    },
    content: {
      minlength: [20, "Announcement content must be at least 20 characters."],
      required: [true, "Announcement content is required."],
      trim: true,
      type: String,
    },
    createdBy: adminReference,
    imageUrl: {
      default: null,
      maxlength: [500, "Image URL must be 500 characters or fewer."],
      trim: true,
      type: String,
      validate: {
        message: "Image URL must be a valid URL.",
        validator: (value) => !value || urlRegex.test(value),
      },
    },
    isPublished: {
      default: false,
      index: true,
      type: Boolean,
    },
    publishedAt: {
      default: null,
      index: true,
      type: Date,
    },
    slug: {
      lowercase: true,
      maxlength: [220, "Slug must be 220 characters or fewer."],
      required: [true, "Slug is required."],
      trim: true,
      type: String,
      unique: true,
    },
    summary: {
      maxlength: [500, "Summary must be 500 characters or fewer."],
      minlength: [10, "Summary must be at least 10 characters."],
      required: [true, "Announcement summary is required."],
      trim: true,
      type: String,
    },
    title: {
      maxlength: [180, "Title must be 180 characters or fewer."],
      minlength: [3, "Title must be at least 3 characters."],
      required: [true, "Announcement title is required."],
      trim: true,
      type: String,
    },
    updatedBy: adminReference,
  },
  {
    collection: "announcements",
    timestamps: true,
  },
);

announcementSchema.index({ isPublished: 1, publishedAt: -1 });
announcementSchema.index({ category: 1, isPublished: 1 });
announcementSchema.index({ createdBy: 1, createdAt: -1 });
announcementSchema.index({ title: "text", summary: "text", content: "text" });

configureMongoSchema(announcementSchema);

const Announcement = mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);

export default Announcement;
