import {
  Announcement,
  AuditLog,
  ContactMessage,
  Donation,
  Event,
  NewsletterSubscriber,
  PrayerRequest,
  SecurityEvent,
} from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const recentLimit = 5;

function startOfTodayDateString() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function amountFacet(match = {}) {
  return [
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ];
}

async function donationSummary() {
  const [result] = await Donation.aggregate([
    {
      $facet: {
        completed: amountFacet({ status: "completed" }),
        monthly: [
          {
            $group: {
              _id: { $dateToString: { date: "$createdAt", format: "%Y-%m" } },
              total: { $sum: "$amount" },
            },
          },
          { $project: { _id: 0, month: "$_id", total: 1 } },
          { $sort: { month: 1 } },
        ],
        pending: amountFacet({ status: "pending" }),
        total: amountFacet(),
      },
    },
    {
      $project: {
        completedDonationsAmount: { $ifNull: [{ $arrayElemAt: ["$completed.total", 0] }, 0] },
        monthlyDonationsTotal: "$monthly",
        pendingDonationsAmount: { $ifNull: [{ $arrayElemAt: ["$pending.total", 0] }, 0] },
        totalDonationsAmount: { $ifNull: [{ $arrayElemAt: ["$total.total", 0] }, 0] },
      },
    },
  ]);

  return {
    completedDonationsAmount: Number(result?.completedDonationsAmount || 0),
    monthlyDonationsTotal: (result?.monthlyDonationsTotal || []).map((item) => ({
      month: item.month,
      total: Number(item.total || 0),
    })),
    pendingDonationsAmount: Number(result?.pendingDonationsAmount || 0),
    totalDonationsAmount: Number(result?.totalDonationsAmount || 0),
  };
}

async function countSummary(todayDate) {
  const [
    totalContactMessages,
    unreadContactMessages,
    totalPrayerRequests,
    pendingPrayerRequests,
    totalNewsletterSubscribers,
    publishedAnnouncementsCount,
    upcomingEventsCount,
  ] = await Promise.all([
    ContactMessage.countDocuments(),
    ContactMessage.countDocuments({ status: "unread" }),
    PrayerRequest.countDocuments(),
    PrayerRequest.countDocuments({ status: "pending" }),
    NewsletterSubscriber.countDocuments({ isSubscribed: true }),
    Announcement.countDocuments({ isPublished: true }),
    Event.countDocuments({ eventDate: { $gte: todayDate }, isPublished: true }),
  ]);

  return {
    pendingPrayerRequests,
    publishedAnnouncementsCount,
    totalContactMessages,
    totalNewsletterSubscribers,
    totalPrayerRequests,
    unreadContactMessages,
    upcomingEventsCount,
  };
}

function recent(model) {
  return model.find().sort({ createdAt: -1 }).limit(recentLimit);
}

async function recentRecords() {
  const [recentDonations, recentContactMessages, recentPrayerRequests, recentAuditLogs, recentSecurityEvents] = await Promise.all([
    recent(Donation),
    recent(ContactMessage),
    recent(PrayerRequest),
    recent(AuditLog),
    recent(SecurityEvent),
  ]);

  return {
    recentAuditLogs,
    recentContactMessages,
    recentDonations,
    recentPrayerRequests,
    recentSecurityEvents,
  };
}

export const getDashboardStats = asyncHandler(async (request, response) => {
  const todayDate = startOfTodayDateString();
  const [donations, counts, recentData] = await Promise.all([donationSummary(), countSummary(todayDate), recentRecords()]);
  const stats = {
    completedDonationsAmount: donations.completedDonationsAmount,
    pendingDonationsAmount: donations.pendingDonationsAmount,
    pendingPrayerRequests: counts.pendingPrayerRequests,
    publishedAnnouncementsCount: counts.publishedAnnouncementsCount,
    totalContactMessages: counts.totalContactMessages,
    totalDonationsAmount: donations.totalDonationsAmount,
    totalNewsletterSubscribers: counts.totalNewsletterSubscribers,
    totalPrayerRequests: counts.totalPrayerRequests,
    unreadContactMessages: counts.unreadContactMessages,
    upcomingEventsCount: counts.upcomingEventsCount,
  };

  response.json({
    charts: {
      monthlyDonationsTotal: donations.monthlyDonationsTotal,
    },
    data: {
      monthlyDonationsTotal: donations.monthlyDonationsTotal,
      recentAuditLogs: recentData.recentAuditLogs,
      recentContactMessages: recentData.recentContactMessages,
      recentDonations: recentData.recentDonations,
      recentPrayerRequests: recentData.recentPrayerRequests,
      recentSecurityEvents: recentData.recentSecurityEvents,
      stats,
    },
    recent: {
      auditLogs: recentData.recentAuditLogs,
      contactMessages: recentData.recentContactMessages,
      donations: recentData.recentDonations,
      prayerRequests: recentData.recentPrayerRequests,
      securityEvents: recentData.recentSecurityEvents,
    },
    stats,
    success: true,
    status: "success",
  });
});
