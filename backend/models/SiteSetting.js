import mongoose from "mongoose";
import { configureMongoSchema, optionalObjectId } from "../utils/mongooseModel.js";

const { Schema } = mongoose;

const adminReference = {
  default: null,
  ref: "Admin",
  set: optionalObjectId,
  type: Schema.Types.ObjectId,
};

const siteSettingSchema = new Schema(
  {
    id: {
      default: "1",
      immutable: true,
      required: true,
      type: String,
      unique: true,
    },
    allowRegistration: {
      default: true,
      type: Boolean,
    },
    allowUserLogin: {
      default: true,
      type: Boolean,
    },
    createdBy: adminReference,
    maintenanceExpectedBack: {
      default: null,
      type: Date,
    },
    maintenanceMessage: {
      default: "We are making a few updates. Please check back soon.",
      maxlength: [1000, "Maintenance message must be 1000 characters or fewer."],
      required: [true, "Maintenance message is required."],
      trim: true,
      type: String,
    },
    maintenanceMode: {
      default: false,
      index: true,
      type: Boolean,
    },
    maintenanceTitle: {
      default: "Website temporarily unavailable",
      maxlength: [180, "Maintenance title must be 180 characters or fewer."],
      minlength: [3, "Maintenance title must be at least 3 characters."],
      required: [true, "Maintenance title is required."],
      trim: true,
      type: String,
    },
    updatedBy: adminReference,
  },
  {
    collection: "site_settings",
    timestamps: true,
  },
);

configureMongoSchema(siteSettingSchema);

const SiteSetting = mongoose.models.SiteSetting || mongoose.model("SiteSetting", siteSettingSchema);

export default SiteSetting;
