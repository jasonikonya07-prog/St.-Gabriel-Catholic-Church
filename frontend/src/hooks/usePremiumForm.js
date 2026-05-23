import { useCallback, useState } from "react";
import { getApiErrorMessage, getApiSuccessMessage } from "../api/axios";

function getMissingRequiredFields(form, requiredFields) {
  const formData = new FormData(form);

  return requiredFields.filter((fieldName) => {
    const value = formData.get(fieldName);
    return !String(value || "").trim();
  });
}

export function usePremiumForm(successMessage) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const submit = useCallback(
    async (event, requiredFields = [], onValidSubmit = null) => {
      event.preventDefault();

      const form = event.currentTarget;
      const missingFields = getMissingRequiredFields(form, requiredFields);

      if (missingFields.length > 0) {
        setStatus({
          type: "error",
          message: "Please complete the required fields before submitting.",
        });
        form.querySelector(`[name="${missingFields[0]}"]`)?.focus();
        return;
      }

      setIsSubmitting(true);
      setStatus(null);

      if (typeof onValidSubmit === "function") {
        try {
          const formData = new FormData(form);
          const payload = Object.fromEntries(formData.entries());
          const response = await onValidSubmit(payload, form);

          setStatus({
            type: "success",
            message: getApiSuccessMessage(response, successMessage),
          });
          form.reset();
        } catch (error) {
          setStatus({
            type: "error",
            message: getApiErrorMessage(error),
          });
        } finally {
          setIsSubmitting(false);
        }

        return;
      }

      window.setTimeout(() => {
        setIsSubmitting(false);
        setStatus({ type: "success", message: successMessage });
        form.reset();
      }, 1200);
    },
    [successMessage],
  );

  return { isSubmitting, status, submit };
}
