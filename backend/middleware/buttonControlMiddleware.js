import { ButtonControl } from "../models/index.js";

const allowedButtonKeys = new Set(["donate_now", "view_mass_times", "contact_us", "prayer_request", "newsletter_subscribe"]);

export function requireButtonEnabled(buttonKey) {
  return async (request, response, next) => {
    try {
      if (!allowedButtonKeys.has(buttonKey)) {
        response.status(403).json({
          message: "This feature is temporarily unavailable.",
          reason: null,
          status: "fail",
          success: false,
        });
        return;
      }

      const control = await ButtonControl.findOne({ where: { buttonKey } });

      if (control && !control.isEnabled) {
        response.status(403).json({
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
