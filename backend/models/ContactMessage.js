import mongoose from "mongoose";
import { configureMongoSchema, objectIdStringDefault, optionalObjectId } from "../utils/mongooseModel.js";

const { Schema } = mongoose;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const contactStatuses = ["unread", "read", "replied"];

const contactMessageSchema = new Schema(
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
    createdBy: {
      default: null,
      ref: "User",
      set: optionalObjectId,
      type: Schema.Types.ObjectId,
    },
    email: {
      index: true,
      lowercase: true,
      maxlength: [160, "Email must be 160 characters or fewer."],
      required: [true, "Email is required."],
      trim: true,
      type: String,
      validate: {
        message: "Please enter a valid email address.",
        validator: (value) => emailRegex.test(String(value || "")),
      },
    },
    fullName: {
      index: true,
      maxlength: [120, "Full name must be 120 characters or fewer."],
      minlength: [2, "Full name must be at least 2 characters."],
      required: [true, "Full name is required."],
      trim: true,
      type: String,
    },
    message: {
      maxlength: [3000, "Message must be 3000 characters or fewer."],
      minlength: [10, "Message must be at least 10 characters."],
      required: [true, "Message is required."],
      trim: true,
      type: String,
    },
    phone: {
      default: null,
      maxlength: [40, "Phone number must be 40 characters or fewer."],
      trim: true,
      type: String,
    },
    status: {
      default: "unread",
      enum: contactStatuses,
      index: true,
      required: true,
      type: String,
    },
    subject: {
      default: "Website inquiry",
      maxlength: [180, "Subject must be 180 characters or fewer."],
      required: [true, "Subject is required."],
      trim: true,
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
    collection: "contact_messages",
    timestamps: true,
  },
);

contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ email: 1, createdAt: -1 });
contactMessageSchema.index({ userId: 1, createdAt: -1 });
contactMessageSchema.index({ createdBy: 1, createdAt: -1 });
contactMessageSchema.index({ fullName: "text", email: "text", subject: "text" });

configureMongoSchema(contactMessageSchema);

const ContactMessage = mongoose.models.ContactMessage || mongoose.model("ContactMessage", contactMessageSchema);

export default ContactMessage;
