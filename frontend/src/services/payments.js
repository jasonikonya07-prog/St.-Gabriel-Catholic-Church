import { getApiErrorMessage } from "../api/axios";
import { getMpesaPaymentStatus, sendMpesaPrompt } from "./donationService";

export function sendMpesaStkPush(payload) {
  return sendMpesaPrompt(payload);
}

export { getMpesaPaymentStatus };

export function getPaymentErrorMessage(error) {
  return getApiErrorMessage(
    error,
    "We could not send the payment request. Please check the backend connection and try again.",
  );
}
