import mongoose from "mongoose";
import { configureMongoSchema, objectIdStringDefault, optionalObjectId } from "../utils/mongooseModel.js";

const { Schema } = mongoose;
const urlRegex = /^https?:\/\/\S+$/i;

export const eventCategories = ["Mass", "Youth", "Charity", "Bible Study", "Parish", "Special"];

const adminReference = {
  default: null,
  ref: "Admin",
  set: optionalObjectId,
  type: Schema.Types.ObjectId,
};

const eventSchema = new Schema(
  {
    id: {
      default: objectIdStringDefault,
      immutable: true,
      required: true,
      type: String,
      unique: true,
    },
    category: {
      default: "Parish",
      enum: eventCategories,
      index: true,
      required: true,
      type: String,
    },
    createdBy: adminReference,
    description: {
      maxlength: [5000, "Description must be 5000 characters or fewer."],
      minlength: [10, "Description must be at least 10 characters."],
      required: [true, "Event description is required."],
      trim: true,
      type: String,
    },
    endTime: {
      default: null,
      maxlength: [20, "End time must be 20 characters or fewer."],
      trim: true,
      type: String,
    },
    eventDate: {
      index: true,
      required: [true, "Event date is required."],
      trim: true,
      type: String,
      validate: {
        message: "Event date must be a valid date.",
        validator: (value) => !Number.isNaN(Date.parse(value)),
      },
    },
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
    isFeatured: {
      default: false,
      index: true,
      type: Boolean,
    },
    isPublished: {
      default: false,
      index: true,
      type: Boolean,
    },
    location: {
      maxlength: [180, "Location must be 180 characters or fewer."],
      minlength: [2, "Location must be at least 2 characters."],
      required: [true, "Event location is required."],
      trim: true,
      type: String,
    },
    slug: {
      lowercase: true,
      maxlength: [220, "Slug must be 220 characters or fewer."],
      required: [true, "Slug is required."],
      trim: true,
      type: String,
      unique: true,
    },
    startTime: {
      maxlength: [20, "Start time must be 20 characters or fewer."],
      required: [true, "Event start time is required."],
      trim: true,
      type: String,
    },
    title: {
      maxlength: [180, "Title must be 180 characters or fewer."],
      minlength: [3, "Title must be at least 3 characters."],
      required: [true, "Event title is required."],
      trim: true,
      type: String,
    },
    updatedBy: adminReference,
  },
  {
    collection: "events",
    timestamps: true,
  },
);

eventSchema.index({ isPublished: 1, eventDate: 1 });
eventSchema.index({ isFeatured: 1, eventDate: 1 });
eventSchema.index({ category: 1, eventDate: 1 });
eventSchema.index({ createdBy: 1, createdAt: -1 });
eventSchema.index({ title: "text", description: "text", location: "text" });

configureMongoSchema(eventSchema);

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

export default Event;
