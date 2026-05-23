function getDarajaBaseUrl() {
  return process.env.MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
}

function requireMpesaConfig() {
  const requiredKeys = [
    "MPESA_CONSUMER_KEY",
    "MPESA_CONSUMER_SECRET",
    "MPESA_SHORTCODE",
    "MPESA_PASSKEY",
    "MPESA_CALLBACK_URL",
  ];
  const missingKeys = requiredKeys.filter((key) => !String(process.env[key] || "").trim());

  if (missingKeys.length) {
    throw new Error(`Missing M-Pesa configuration: ${missingKeys.join(", ")}`);
  }
}

export function formatMpesaPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;

  throw new Error("Please enter a valid Kenyan phone number, for example 07XXXXXXXX.");
}

export function createMpesaTimestamp(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: "Africa/Nairobi",
    year: "numeric",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));

  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
}

export function createMpesaPassword(timestamp) {
  return Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64");
}

export async function getMpesaAccessToken() {
  requireMpesaConfig();

  const credentials = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
  const response = await fetch(`${getDarajaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    method: "GET",
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    throw new Error(data.errorMessage || data.error_description || "Unable to generate M-Pesa access token.");
  }

  return data.access_token;
}

export async function initiateStkPush({ amount, phone, reference, transactionDescription }) {
  const accessToken = await getMpesaAccessToken();
  const timestamp = createMpesaTimestamp();
  const response = await fetch(`${getDarajaBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
    body: JSON.stringify({
      AccountReference: reference,
      Amount: Math.round(Number(amount)),
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      Password: createMpesaPassword(timestamp),
      PhoneNumber: phone,
      Timestamp: timestamp,
      TransactionDesc: transactionDescription || "Church donation",
      TransactionType: "CustomerPayBillOnline",
    }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ResponseCode !== "0") {
    throw new Error(data.errorMessage || data.ResponseDescription || data.CustomerMessage || "Unable to initiate M-Pesa STK Push.");
  }

  return data;
}

export function parseStkCallback(callbackBody) {
  const callback = callbackBody?.Body?.stkCallback || {};
  const metadataItems = callback.CallbackMetadata?.Item || [];
  const metadata = Object.fromEntries(metadataItems.map((item) => [item.Name, item.Value]));

  return {
    amount: metadata.Amount,
    checkoutRequestId: callback.CheckoutRequestID,
    merchantRequestId: callback.MerchantRequestID,
    mpesaReceiptNumber: metadata.MpesaReceiptNumber,
    phone: metadata.PhoneNumber ? String(metadata.PhoneNumber) : undefined,
    resultCode: Number(callback.ResultCode),
    resultDescription: callback.ResultDesc,
    transactionDate: metadata.TransactionDate,
  };
}
