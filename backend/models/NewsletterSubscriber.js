import mongoose from "mongoose";
import { configureMongoSchema, objectIdStringDefault, optionalObjectId } from "../utils/mongooseModel.js";

const { Schema } = mongoose;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const newsletterSubscriberSchema = new Schema(
  {
    id: {
      default: objectIdStringDefault,
      immutable: true,
      required: true,
      type: String,
      unique: true,
    },
    createdBy: {
      default: null,
      ref: "User",
      set: optionalObjectId,
      type: Schema.Types.ObjectId,
    },
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
    fullName: {
      default: null,
      maxlength: [120, "Full name must be 120 characters or fewer."],
      trim: true,
      type: String,
    },
    isSubscribed: {
      default: true,
      index: true,
      type: Boolean,
    },
    source: {
      default: "website",
      maxlength: [80, "Source must be 80 characters or fewer."],
      trim: true,
      type: String,
    },
    unsubscribedAt: {
      default: null,
      type: Date,
    },
    updatedBy: {
      default: null,
      ref: "Admin",
      set: optionalObjectId,
      type: Schema.Types.ObjectId,
    },
  },
  {
    collection: "newsletter_subscribers",
    timestamps: true,
  },
);

newsletterSubscriberSchema.index({ isSubscribed: 1, createdAt: -1 });
newsletterSubscriberSchema.index({ createdAt: -1 });
newsletterSubscriberSchema.index({ email: "text", fullName: "text" });

configureMongoSchema(newsletterSubscriberSchema);

const NewsletterSubscriber = mongoose.models.NewsletterSubscriber || mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);

export default NewsletterSubscriber;
