import {
  deleteDonation,
  getDonation,
  getDonationStats,
  getDonations,
  updateDonationStatus as updateDonationStatusRequest,
} from "../../services/donationService";

function normalizeDonation(donation = {}) {
  return {
    ...donation,
    mpesaReceipt: donation.mpesaReceipt ?? donation.mpesaReceiptNumber ?? "",
    referenceNumber: donation.referenceNumber ?? donation.transactionCode ?? "",
  };
}

function normalizeDonationResponse(response) {
  if (!response) return response;
  const donations = response.donations || response.data?.donations;
  const donation = response.donation || response.data?.donation;

  if (Array.isArray(donations)) {
    const normalized = donations.map(normalizeDonation);
    return {
      ...response,
      data: { ...(response.data || {}), donations: normalized },
      donations: normalized,
    };
  }

  if (donation) {
    const normalized = normalizeDonation(donation);
    return {
      ...response,
      data: { ...(response.data || {}), donation: normalized },
      donation: normalized,
    };
  }

  return normalizeDonation(response);
}

export async function getAdminDonations(params = {}) {
  return normalizeDonationResponse(await getDonations(params));
}

export async function getAdminDonation(id) {
  return normalizeDonationResponse(await getDonation(id));
}

export async function updateDonationStatus(id, status) {
  return normalizeDonationResponse(await updateDonationStatusRequest(id, { status }));
}

export function getAdminDonationStats() {
  return getDonationStats();
}

export function deleteAdminDonation(id) {
  return deleteDonation(id);
}

export async function getDonationRecords() {
  const response = await getAdminDonations();
  return response?.donations || response?.data?.donations || [];
}
