import ApiError from "../utils/ApiError.js";
import { ButtonControl } from "../models/index.js";

const allowedButtonKeys = new Set(["donate_now", "view_mass_times", "contact_us", "prayer_request", "newsletter_subscribe"]);

export function requireButtonEnabled(buttonKey) {
  return async (request, response, next) => {
    try {
      if (!allowedButtonKeys.has(buttonKey)) {
        throw new ApiError(500, "Invalid button control configuration.");
      }

      const control = await ButtonControl.findOne({ buttonKey });

      if (control && !control.isEnabled) {
        response.status(403).json({
          buttonKey,
          data: {
            buttonKey,
            disabledReason: control.disabledReason || null,
            isEnabled: false,
          },
          message: "This feature is temporarily unavailable.",
          reason: control.disabledReason || null,
          status: "fail",
          success: false,
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
