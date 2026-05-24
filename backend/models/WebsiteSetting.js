import { createMongoModel } from "../utils/mongooseModel.js";

const WebsiteSetting = createMongoModel(
  "WebsiteSetting",
  {
    settingKey: {
      maxlength: 80,
      required: true,
      trim: true,
      type: String,
      unique: true,
    },
    settingValue: {
      default: null,
      type: String,
    },
  },
  {
    collection: "website_settings",
  },
);

export default WebsiteSetting;
