import mongoose from "mongoose";
import { configureMongoSchema, objectIdStringDefault, optionalObjectId } from "../utils/mongooseModel.js";

const { Schema } = mongoose;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const donationPurposes = ["Tithe", "Church Development", "Charity", "Youth Ministry", "Mass Offering", "Other"];
export const paymentMethods = ["M-Pesa", "Card", "Bank Transfer"];
export const donationStatuses = ["pending", "completed", "failed", "cancelled"];

const donationSchema = new Schema(
  {
    id: {
      default: objectIdStringDefault,
      immutable: true,
      required: true,
      type: String,
      unique: true,
    },
    amount: {
      min: [1, "Donation amount must be greater than zero."],
      required: [true, "Donation amount is required."],
      type: Number,
    },
    checkoutRequestId: {
      default: null,
      index: true,
      maxlength: [120, "Checkout request ID must be 120 characters or fewer."],
      trim: true,
      type: String,
    },
    createdBy: {
      default: null,
      ref: "User",
      set: optionalObjectId,
      type: Schema.Types.ObjectId,
    },
    donorName: {
      maxlength: [120, "Donor name must be 120 characters or fewer."],
      minlength: [2, "Donor name must be at least 2 characters."],
      required: [true, "Donor name is required."],
      trim: true,
      type: String,
    },
    email: {
      default: null,
      lowercase: true,
      maxlength: [160, "Email must be 160 characters or fewer."],
      trim: true,
      type: String,
      validate: {
        message: "Please enter a valid email address.",
        validator: (value) => !value || emailRegex.test(value),
      },
    },
    message: {
      default: null,
      maxlength: [1000, "Message must be 1000 characters or fewer."],
      trim: true,
      type: String,
    },
    mpesaReceiptNumber: {
      default: null,
      index: true,
      maxlength: [100, "M-Pesa receipt number must be 100 characters or fewer."],
      trim: true,
      type: String,
    },
    paymentMethod: {
      enum: paymentMethods,
      index: true,
      required: [true, "Payment method is required."],
      type: String,
    },
    phone: {
      maxlength: [40, "Phone number must be 40 characters or fewer."],
      required: [true, "Phone number is required."],
      trim: true,
      type: String,
    },
    purpose: {
      enum: donationPurposes,
      index: true,
      required: [true, "Donation purpose is required."],
      type: String,
    },
    status: {
      default: "pending",
      enum: donationStatuses,
      index: true,
      required: true,
      type: String,
    },
    transactionCode: {
      maxlength: [100, "Transaction code must be 100 characters or fewer."],
      required: [true, "Transaction code is required."],
      trim: true,
      type: String,
      unique: true,
      uppercase: true,
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
    collection: "donations",
    timestamps: true,
  },
);

donationSchema.index({ status: 1, createdAt: -1 });
donationSchema.index({ purpose: 1, createdAt: -1 });
donationSchema.index({ paymentMethod: 1, createdAt: -1 });
donationSchema.index({ userId: 1, createdAt: -1 });
donationSchema.index({ createdBy: 1, createdAt: -1 });
donationSchema.index({ donorName: "text", phone: "text", email: "text", transactionCode: "text" });

configureMongoSchema(donationSchema);

const Donation = mongoose.models.Donation || mongoose.model("Donation", donationSchema);

export default Donation;
