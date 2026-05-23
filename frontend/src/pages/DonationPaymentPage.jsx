import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaCreditCard,
  FaLock,
  FaMobileAlt,
  FaPhoneAlt,
  FaReceipt,
  FaShieldAlt,
  FaSpinner,
  FaTimesCircle,
} from "react-icons/fa";
import { Link, Navigate, useLocation } from "react-router-dom";
import FormAlert from "../components/FormAlert";
import PremiumButton from "../components/PremiumButton";
import PremiumField from "../components/PremiumField";
import { getPaymentErrorMessage, sendMpesaStkPush } from "../services/payments";
import { createDonation, getMpesaPaymentStatus } from "../services/donationService";
import { formatKenyanPhoneNumber, formatMoney, normalizeApiStatus } from "../utils/donation";
import { gentleEase } from "../utils/animations";

const paymentMethods = [
  {
    id: "safaricom",
    label: "Safaricom",
    brand: "Safaricom M-Pesa",
    description: "Receive a secure STK prompt on your phone.",
    icon: FaMobileAlt,
  },
  {
    id: "airtel",
    label: "Airtel",
    brand: "Airtel Money",
    description: "Enter your Airtel number to continue securely.",
    icon: FaPhoneAlt,
  },
  {
    id: "card",
    label: "Card",
    brand: "Card Payment",
    description: "Pay by debit or credit card.",
    icon: FaCreditCard,
  },
];

const completedMessage = "Thank you for supporting St. Gabriel Catholic Church. Your offering has been received.";

function getPaymentMethod(methodId) {
  return paymentMethods.find((method) => method.id === methodId) || paymentMethods[0];
}

function readStoredDonation() {
  try {
    return JSON.parse(sessionStorage.getItem("stGabrielDonation") || "null");
  } catch {
    return null;
  }
}

function formatCardNumber(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

function formatCardExpiry(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) return digits;

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isValidCardExpiry(value) {
  const match = String(value || "").match(/^(\d{2})\/(\d{2})$/);

  if (!match) return false;

  const month = Number(match[1]);
  return month >= 1 && month <= 12;
}

function createReceiptNumber(methodId) {
  const prefix = methodId === "card" ? "CARD" : methodId === "airtel" ? "AIRTEL" : "MPESA";
  return `${prefix}-${Date.now().toString().slice(-8)}`;
}

function getStatusCopy(paymentState, selectedMethod) {
  const method = getPaymentMethod(selectedMethod);

  const copy = {
    idle: {
      icon: FaShieldAlt,
      tone: "gold",
      title: "Secure payment",
      message:
        method.id === "card"
          ? "Enter your card details to complete your offering securely."
          : `Enter your ${method.label} number to receive a secure payment prompt.`,
    },
    sending: {
      icon: FaSpinner,
      tone: "gold",
      title: "Processing payment",
      message:
        method.id === "card"
          ? "Processing secure card payment..."
          : `Sending secure ${method.label} payment prompt...`,
    },
    prompt_sent: {
      icon: FaMobileAlt,
      tone: "gold",
      title: "Prompt sent",
      message: `Payment prompt sent. Please check your ${method.label} phone and confirm.`,
    },
    waiting_confirmation: {
      icon: FaSpinner,
      tone: "gold",
      title: "Confirming payment",
      message: "Waiting for payment confirmation...",
    },
    completed: {
      icon: FaCheckCircle,
      tone: "success",
      title: "Offering received",
      message: completedMessage,
    },
    failed: {
      icon: FaTimesCircle,
      tone: "error",
      title: "Payment not completed",
      message: "Payment failed or was cancelled. Please try again.",
    },
  };

  return copy[paymentState] || copy.idle;
}

function PaymentMethodSelector({ disabled, onSelect, selectedMethod }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {paymentMethods.map((method) => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;

        return (
          <button
            key={method.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(method.id)}
            className={`group min-h-[92px] rounded-2xl border p-4 text-left transition duration-300 focus:outline-none focus:ring-4 focus:ring-gold/20 ${
              isSelected
                ? "border-gold bg-gold/10 shadow-[0_16px_40px_rgba(201,162,39,0.16)]"
                : "border-navy/10 bg-cream hover:border-gold/70 hover:bg-white hover:shadow-soft"
            } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
          >
            <span className="flex items-start gap-3">
              <span
                className={`grid h-10 w-10 flex-none place-items-center rounded-full transition duration-300 ${
                  isSelected ? "bg-gold text-navy" : "bg-white text-gold shadow-sm group-hover:bg-gold group-hover:text-navy"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-base font-extrabold leading-tight text-navy">{method.label}</span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-warm">{method.description}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PaymentStatusPanel({ detail, paymentState, selectedMethod }) {
  const content = getStatusCopy(paymentState, selectedMethod);
  const Icon = content.icon;
  const toneClassName =
    content.tone === "success"
      ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-700"
      : content.tone === "error"
        ? "border-red-300 bg-red-50 text-red-700"
        : "border-gold/35 bg-gold/10 text-navy";
  const iconClassName =
    content.tone === "success"
      ? "bg-emerald-500 text-white"
      : content.tone === "error"
        ? "bg-red-600 text-white"
        : "bg-gold text-navy";

  return (
    <motion.div
      key={`${selectedMethod}-${paymentState}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: gentleEase }}
      className={`rounded-2xl border p-4 ${toneClassName}`}
      role={paymentState === "failed" ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 flex-none place-items-center rounded-full ${iconClassName}`}>
          <Icon
            className={`h-4 w-4 ${
              paymentState === "sending" || paymentState === "waiting_confirmation" ? "animate-spin" : ""
            }`}
          />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold leading-tight">{content.title}</h2>
          <p className="mt-1.5 text-sm font-bold leading-6">{detail || content.message}</p>
        </div>
      </div>
    </motion.div>
  );
}

function DonationReceipt({ result }) {
  if (!result) return null;

  const receiptNumber = result.receiptNumber || result.mpesaReceiptNumber || result.receipt || "Pending receipt";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: gentleEase }}
      className="rounded-2xl border border-emerald-400/30 bg-emerald-50 p-4 text-navy shadow-soft"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-full bg-emerald-500 text-white">
          <FaReceipt className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">Payment receipt</p>
          <h3 className="mt-1.5 font-display text-xl font-bold leading-tight text-navy">
            Thank you for supporting the church.
          </h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-emerald-700">{completedMessage}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-emerald-500/15 bg-white p-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-warm">Receipt</p>
          <p className="mt-2 break-all font-bold text-navy">{receiptNumber}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/15 bg-white p-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-warm">Amount</p>
          <p className="mt-2 font-display text-2xl font-bold text-navy">{formatMoney(result.amount)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/15 bg-white p-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-warm">Purpose</p>
          <p className="mt-2 font-bold text-navy">{result.purpose}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/15 bg-white p-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-warm">Method</p>
          <p className="mt-2 font-bold text-navy">{result.paymentMethod}</p>
        </div>
      </div>
    </motion.div>
  );
}

function DonationPaymentPage() {
  const location = useLocation();
  const localTimerRef = useRef(null);
  const [donation] = useState(() => location.state?.donation || readStoredDonation());
  const [selectedMethod, setSelectedMethod] = useState("safaricom");
  const [paymentState, setPaymentState] = useState("idle");
  const [paymentDetail, setPaymentDetail] = useState(getStatusCopy("idle", "safaricom").message);
  const [paymentResult, setPaymentResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [pollingId, setPollingId] = useState(null);
  const [paymentForm, setPaymentForm] = useState(() => ({
    airtelPhone: "",
    cardCvv: "",
    cardExpiry: "",
    cardName: "",
    cardNumber: "",
    safaricomPhone: "",
  }));

  useEffect(() => {
    if (!donation) return;

    setPaymentForm((current) => ({
      ...current,
      airtelPhone: current.airtelPhone || donation.phone || "",
      cardName: current.cardName || donation.donorName || "",
      safaricomPhone: current.safaricomPhone || donation.phone || "",
    }));
  }, [donation]);

  useEffect(() => {
    if (!pollingId) return undefined;

    let attempts = 0;
    const intervalId = window.setInterval(async () => {
      attempts += 1;

      try {
        const response = await getMpesaPaymentStatus(pollingId);
        const nextStatus = normalizeApiStatus(response.status);

        if (nextStatus === "completed") {
          window.clearInterval(intervalId);
          setPollingId(null);
          setPaymentState("completed");
          setPaymentDetail(completedMessage);
          setPaymentResult((current) => ({
            ...current,
            ...response,
            amount: response.amount ?? current?.amount ?? donation.amount,
            paymentMethod: "Safaricom M-Pesa",
            purpose: response.purpose ?? current?.purpose ?? donation.purpose,
            receiptNumber: response.receiptNumber || response.mpesaReceiptNumber || current?.receiptNumber,
          }));
          setStatus({ type: "success", message: completedMessage });
          return;
        }

        if (nextStatus === "failed") {
          window.clearInterval(intervalId);
          setPollingId(null);
          setPaymentState("failed");
          setPaymentDetail(response.message || getStatusCopy("failed", selectedMethod).message);
          setStatus({ type: "error", message: response.message || getStatusCopy("failed", selectedMethod).message });
          return;
        }

        setPaymentState("waiting_confirmation");
        setPaymentDetail(getStatusCopy("waiting_confirmation", selectedMethod).message);
      } catch (error) {
        window.clearInterval(intervalId);
        setPollingId(null);
        const message = getPaymentErrorMessage(error);
        setPaymentState("failed");
        setPaymentDetail(message);
        setStatus({ type: "error", message });
        return;
      }

      if (attempts >= 24) {
        window.clearInterval(intervalId);
        setPollingId(null);
        const message = "Payment confirmation timed out. Please try again or contact the parish office.";
        setPaymentState("failed");
        setPaymentDetail(message);
        setStatus({ type: "error", message });
      }
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [donation?.amount, donation?.purpose, pollingId, selectedMethod]);

  useEffect(() => {
    return () => {
      if (localTimerRef.current) {
        window.clearTimeout(localTimerRef.current);
      }
    };
  }, []);

  if (!donation) {
    return <Navigate to="/donate" replace />;
  }

  const selectedPaymentMethod = getPaymentMethod(selectedMethod);
  const isSending = paymentState === "sending";
  const isPaymentLocked = ["sending", "prompt_sent", "waiting_confirmation"].includes(paymentState);

  const resetPaymentState = (methodId) => {
    if (isPaymentLocked) return;

    if (localTimerRef.current) {
      window.clearTimeout(localTimerRef.current);
      localTimerRef.current = null;
    }

    setSelectedMethod(methodId);
    setPaymentState("idle");
    setPaymentDetail(getStatusCopy("idle", methodId).message);
    setPaymentResult(null);
    setPollingId(null);
    setStatus(null);
  };

  const updatePaymentForm = (event) => {
    const { name, value } = event.target;
    const nextValue =
      name === "cardNumber" ? formatCardNumber(value) : name === "cardExpiry" ? formatCardExpiry(value) : value;

    setPaymentForm((current) => ({
      ...current,
      [name]: nextValue,
    }));
    setStatus(null);
  };

  const validateMobilePayment = (fieldName, providerName) => {
    const phone = formatKenyanPhoneNumber(paymentForm[fieldName]);

    if (!phone) {
      setStatus({
        type: "error",
        message: `Please enter a valid Kenyan ${providerName} phone number, for example 07XXXXXXXX or +2547XXXXXXXX.`,
      });
      document.querySelector(`[name="${fieldName}"]`)?.focus();
      return null;
    }

    return phone;
  };

  const validateCardPayment = () => {
    const cardNumber = paymentForm.cardNumber.replace(/\D/g, "");
    const cardCvv = paymentForm.cardCvv.replace(/\D/g, "");

    if (!paymentForm.cardName.trim()) {
      setStatus({ type: "error", message: "Please enter the name on the card." });
      document.querySelector('[name="cardName"]')?.focus();
      return null;
    }

    if (cardNumber.length < 13) {
      setStatus({ type: "error", message: "Please enter a valid card number." });
      document.querySelector('[name="cardNumber"]')?.focus();
      return null;
    }

    if (!isValidCardExpiry(paymentForm.cardExpiry)) {
      setStatus({ type: "error", message: "Please enter a valid card expiry date." });
      document.querySelector('[name="cardExpiry"]')?.focus();
      return null;
    }

    if (cardCvv.length < 3) {
      setStatus({ type: "error", message: "Please enter the card security code." });
      document.querySelector('[name="cardCvv"]')?.focus();
      return null;
    }

    return {
      cardLast4: cardNumber.slice(-4),
      cardName: paymentForm.cardName.trim(),
    };
  };

  const completeLocalPayment = ({ apiPaymentMethod, displayPaymentMethod, phone, cardLast4 }) => {
    setPaymentState("sending");
    setPaymentDetail(getStatusCopy("sending", selectedMethod).message);
    setPaymentResult(null);
    setStatus(null);

    localTimerRef.current = window.setTimeout(async () => {
      try {
        const response = await createDonation({
          amount: donation.amount,
          donorName: donation.donorName,
          email: donation.email,
          message: donation.message || undefined,
          paymentMethod: apiPaymentMethod,
          phone: phone || donation.phone,
          purpose: donation.purpose,
          status: "completed",
        });
        const savedDonation = response?.donation || response?.data?.donation;

        setPaymentState("completed");
        setPaymentDetail(completedMessage);
        setPaymentResult({
          amount: savedDonation?.amount ?? donation.amount,
          cardLast4,
          paymentMethod: displayPaymentMethod,
          phone: phone || donation.phone,
          purpose: savedDonation?.purpose ?? donation.purpose,
          receiptNumber: savedDonation?.transactionCode || createReceiptNumber(selectedMethod),
        });
        setStatus({ type: "success", message: completedMessage });
      } catch (error) {
        const message = getPaymentErrorMessage(error);
        setPaymentState("failed");
        setPaymentDetail(message);
        setStatus({ type: "error", message });
      }
    }, selectedMethod === "card" ? 1400 : 2200);
  };

  const handleSafaricomPayment = async () => {
    const phone = validateMobilePayment("safaricomPhone", "Safaricom");

    if (!phone) return;

    setPaymentState("sending");
    setPaymentDetail(getStatusCopy("sending", "safaricom").message);
    setPaymentResult(null);
    setStatus(null);

    try {
      const response = await sendMpesaStkPush({
        amount: donation.amount,
        donationId: donation.id || donation.donationId,
        donorName: donation.donorName,
        email: donation.email,
        message: donation.message || undefined,
        phone,
        purpose: donation.purpose,
        transactionCode: donation.transactionCode,
      });
      const checkoutRequestId = response.checkoutRequestId;

      if (!checkoutRequestId) {
        throw new Error("Missing checkoutRequestId from backend response.");
      }

      setPaymentResult({
        ...response,
        amount: donation.amount,
        paymentMethod: "Safaricom M-Pesa",
        phone,
        purpose: donation.purpose,
      });
      setPaymentState("prompt_sent");
      setPaymentDetail(getStatusCopy("prompt_sent", "safaricom").message);
      setStatus({ type: "success", message: getStatusCopy("prompt_sent", "safaricom").message });

      window.setTimeout(() => {
        setPaymentState("waiting_confirmation");
        setPaymentDetail(getStatusCopy("waiting_confirmation", "safaricom").message);
        setPollingId(checkoutRequestId);
      }, 1800);
    } catch (error) {
      const message = getPaymentErrorMessage(error);
      setPaymentState("failed");
      setPaymentDetail(message);
      setStatus({ type: "error", message });
    }
  };

  const handleAirtelPayment = () => {
    const phone = validateMobilePayment("airtelPhone", "Airtel");

    if (!phone) return;

    setPaymentResult(null);
    setPaymentState("prompt_sent");
    setPaymentDetail(getStatusCopy("prompt_sent", "airtel").message);
    setStatus({ type: "success", message: getStatusCopy("prompt_sent", "airtel").message });

    localTimerRef.current = window.setTimeout(() => {
      setPaymentState("waiting_confirmation");
      setPaymentDetail(getStatusCopy("waiting_confirmation", "airtel").message);

      localTimerRef.current = window.setTimeout(() => {
        setPaymentState("completed");
        setPaymentDetail(completedMessage);
        createDonation({
          amount: donation.amount,
          donorName: donation.donorName,
          email: donation.email,
          message: donation.message || undefined,
          paymentMethod: "Airtel Money",
          phone,
          purpose: donation.purpose,
          status: "completed",
        })
          .then((response) => {
            const savedDonation = response?.donation || response?.data?.donation;
            setPaymentResult({
              amount: savedDonation?.amount ?? donation.amount,
              paymentMethod: "Airtel Money",
              phone,
              purpose: savedDonation?.purpose ?? donation.purpose,
              receiptNumber: savedDonation?.transactionCode || createReceiptNumber("airtel"),
            });
            setStatus({ type: "success", message: completedMessage });
          })
          .catch((error) => {
            const message = getPaymentErrorMessage(error);
            setPaymentState("failed");
            setPaymentDetail(message);
            setStatus({ type: "error", message });
          });
      }, 1600);
    }, 900);
  };

  const handleCardPayment = () => {
    const cardDetails = validateCardPayment();

    if (!cardDetails) return;

    completeLocalPayment({
      cardLast4: cardDetails.cardLast4,
      apiPaymentMethod: "Card",
      displayPaymentMethod: `Card ending ${cardDetails.cardLast4}`,
    });
  };

  const handlePayment = () => {
    if (selectedMethod === "safaricom") {
      handleSafaricomPayment();
      return;
    }

    if (selectedMethod === "airtel") {
      handleAirtelPayment();
      return;
    }

    handleCardPayment();
  };

  const submitLabel =
    paymentState === "failed"
      ? `Retry ${selectedPaymentMethod.label} Payment`
      : selectedMethod === "card"
        ? "Pay Securely by Card"
        : `Pay with ${selectedPaymentMethod.label}`;

  return (
    <section className="bg-navy py-8 text-white sm:py-14 lg:py-16">
      <div className="section-shell">
        <Link
          to="/donate"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold uppercase tracking-[0.14em] text-gold transition hover:text-white"
        >
          <FaArrowLeft className="h-3.5 w-3.5" />
          Edit details
        </Link>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
          <motion.aside
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.42, ease: gentleEase }}
            className="rounded-2xl border border-white/12 bg-white/[0.08] p-4 shadow-premium sm:p-5"
          >
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gold">Offering summary</p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="shrink-0 font-semibold text-white/58">Purpose</span>
                <span className="min-w-0 break-words text-right font-extrabold text-white">{donation.purpose}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="shrink-0 font-semibold text-white/58">Amount</span>
                <span className="min-w-0 break-words text-right font-display text-2xl font-bold text-white">{formatMoney(donation.amount)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="shrink-0 font-semibold text-white/58">Donor</span>
                <span className="min-w-0 break-words text-right font-extrabold text-white">{donation.donorName}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="shrink-0 font-semibold text-white/58">Default phone</span>
                <span className="min-w-0 break-words text-right font-extrabold text-gold">{donation.phone}</span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-gold/25 bg-gold/10 p-4">
              <div className="flex items-start gap-3">
                <FaLock className="mt-1 h-4 w-4 flex-none text-gold" />
                <p className="text-sm font-semibold leading-6 text-white/72">
                  Choose Safaricom, Airtel, or Card. A receipt will be shown after a successful transaction.
                </p>
              </div>
            </div>
          </motion.aside>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.42, ease: gentleEase }}
            className="rounded-2xl border border-white/12 bg-white p-4 text-navy shadow-premium sm:p-5"
          >
            <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gold">Payment method</p>
              <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-navy sm:text-3xl">
                Choose how you want to give
              </h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-warm">
                Select Safaricom, Airtel, or Card, then enter the details needed to complete your offering.
              </p>
            </div>

            <div className="mt-4">
              <PaymentMethodSelector
                disabled={isPaymentLocked}
                selectedMethod={selectedMethod}
                onSelect={resetPaymentState}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedMethod}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: gentleEase }}
                className="mt-4 rounded-2xl border border-navy/10 bg-white p-4 shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gold text-navy">
                    <selectedPaymentMethod.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gold">
                      {selectedPaymentMethod.label}
                    </p>
                    <h2 className="font-display text-xl font-bold leading-tight text-navy">
                      {selectedPaymentMethod.brand}
                    </h2>
                  </div>
                </div>

                {selectedMethod === "safaricom" ? (
                  <PremiumField
                    className="mt-4"
                    label="Safaricom Number"
                    name="safaricomPhone"
                    type="tel"
                    inputMode="tel"
                    placeholder="07XX XXX XXX"
                    value={paymentForm.safaricomPhone}
                    onChange={updatePaymentForm}
                    icon={FaMobileAlt}
                    required
                  />
                ) : null}

                {selectedMethod === "airtel" ? (
                  <PremiumField
                    className="mt-4"
                    label="Airtel Number"
                    name="airtelPhone"
                    type="tel"
                    inputMode="tel"
                    placeholder="07XX XXX XXX"
                    value={paymentForm.airtelPhone}
                    onChange={updatePaymentForm}
                    icon={FaPhoneAlt}
                    required
                  />
                ) : null}

                {selectedMethod === "card" ? (
                  <div className="mt-4 grid gap-4">
                    <PremiumField
                      label="Name on Card"
                      name="cardName"
                      value={paymentForm.cardName}
                      onChange={updatePaymentForm}
                      icon={FaCreditCard}
                      required
                    />
                    <PremiumField
                      label="Card Number"
                      name="cardNumber"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={paymentForm.cardNumber}
                      onChange={updatePaymentForm}
                      icon={FaCreditCard}
                      required
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <PremiumField
                        label="Expiry"
                        name="cardExpiry"
                        inputMode="numeric"
                        placeholder="MM/YY"
                        value={paymentForm.cardExpiry}
                        onChange={updatePaymentForm}
                        required
                      />
                      <PremiumField
                        label="Security Code"
                        name="cardCvv"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="CVV"
                        value={paymentForm.cardCvv}
                        onChange={updatePaymentForm}
                        required
                      />
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="mt-4">
              <AnimatePresence mode="wait">
                <PaymentStatusPanel
                  detail={paymentDetail}
                  paymentState={paymentState}
                  selectedMethod={selectedMethod}
                />
              </AnimatePresence>
            </div>

            {paymentState === "completed" ? (
              <div className="mt-4">
                <DonationReceipt result={paymentResult} />
              </div>
            ) : null}

            {paymentResult?.checkoutRequestId ? (
              <div className="mt-4 rounded-2xl border border-navy/10 bg-cream p-4 text-sm font-bold leading-6 text-navy">
                Confirmation ID: <span className="break-all text-gold">{paymentResult.checkoutRequestId}</span>
              </div>
            ) : null}

            <FormAlert status={status} />

            {paymentState === "completed" ? (
              <PremiumButton
                to="/donate"
                variant="light"
                fullWidth
                icon={FaCheckCircle}
                className="mt-4 min-h-[46px] px-5 py-3 text-xs tracking-[0.1em] sm:px-7 sm:text-sm sm:tracking-[0.12em]"
              >
                Make Another Offering
              </PremiumButton>
            ) : (
              <PremiumButton
                type="button"
                variant="gold"
                fullWidth
                icon={selectedMethod === "card" ? FaCreditCard : FaMobileAlt}
                loading={isSending}
                loadingLabel="Processing payment..."
                disabled={isPaymentLocked}
                onClick={handlePayment}
                className="mt-4 min-h-[46px] px-5 py-3 text-xs tracking-[0.1em] sm:px-7 sm:text-sm sm:tracking-[0.12em]"
              >
                {submitLabel}
              </PremiumButton>
            )}

            {paymentState === "failed" ? (
              <p className="mt-3 text-center text-xs font-semibold leading-5 text-warm">
                You can retry the payment or go back to edit your details.
              </p>
            ) : null}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default DonationPaymentPage;
