import mongoose from "mongoose";
import { configureMongoSchema, objectIdStringDefault, optionalObjectId } from "../utils/mongooseModel.js";

const { Schema } = mongoose;

export const buttonKeys = ["donate_now", "view_mass_times", "contact_us", "prayer_request", "newsletter_subscribe"];

const adminReference = {
  default: null,
  ref: "Admin",
  set: optionalObjectId,
  type: Schema.Types.ObjectId,
};

const buttonControlSchema = new Schema(
  {
    id: {
      default: objectIdStringDefault,
      immutable: true,
      required: true,
      type: String,
      unique: true,
    },
    buttonKey: {
      enum: buttonKeys,
      required: [true, "Button key is required."],
      trim: true,
      type: String,
      unique: true,
    },
    buttonLabel: {
      maxlength: [120, "Button label must be 120 characters or fewer."],
      minlength: [2, "Button label must be at least 2 characters."],
      required: [true, "Button label is required."],
      trim: true,
      type: String,
    },
    createdBy: adminReference,
    disabledReason: {
      default: null,
      maxlength: [255, "Disabled reason must be 255 characters or fewer."],
      trim: true,
      type: String,
    },
    isEnabled: {
      default: true,
      index: true,
      type: Boolean,
    },
    updatedBy: adminReference,
  },
  {
    collection: "button_controls",
    timestamps: true,
  },
);

buttonControlSchema.index({ updatedBy: 1 });
buttonControlSchema.index({ createdAt: -1 });

configureMongoSchema(buttonControlSchema);

const ButtonControl = mongoose.models.ButtonControl || mongoose.model("ButtonControl", buttonControlSchema);

export default ButtonControl;
