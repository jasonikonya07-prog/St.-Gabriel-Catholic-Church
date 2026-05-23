import { Op, col, fn } from "sequelize";
import { Announcement, ContactMessage, Donation, Event, NewsletterSubscriber, PrayerRequest } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDashboardStats = asyncHandler(async (request, response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const [
    totalDonationsAmount,
    completedDonationsAmount,
    pendingDonationsAmount,
    totalContactMessages,
    unreadContactMessages,
    totalPrayerRequests,
    pendingPrayerRequests,
    totalNewsletterSubscribers,
    publishedAnnouncementsCount,
    upcomingEventsCount,
    monthlyDonationsTotal,
    recentDonations,
    recentContactMessages,
    recentPrayerRequests,
  ] = await Promise.all([
    Donation.sum("amount"),
    Donation.sum("amount", { where: { status: "completed" } }),
    Donation.sum("amount", { where: { status: "pending" } }),
    ContactMessage.count(),
    ContactMessage.count({ where: { status: "unread" } }),
    PrayerRequest.count(),
    PrayerRequest.count({ where: { status: "pending" } }),
    NewsletterSubscriber.count({ where: { isSubscribed: true } }),
    Announcement.count({ where: { isPublished: true } }),
    Event.count({ where: { eventDate: { [Op.gte]: todayDate }, isPublished: true } }),
    Donation.findAll({
      attributes: [[fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "month"], [fn("SUM", col("amount")), "total"]],
      group: [fn("DATE_FORMAT", col("createdAt"), "%Y-%m")],
      order: [[fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "ASC"]],
      raw: true,
    }),
    Donation.findAll({ limit: 5, order: [["createdAt", "DESC"]] }),
    ContactMessage.findAll({ limit: 5, order: [["createdAt", "DESC"]] }),
    PrayerRequest.findAll({ limit: 5, order: [["createdAt", "DESC"]] }),
  ]);

  const stats = {
    completedDonationsAmount: Number(completedDonationsAmount || 0),
    pendingDonationsAmount: Number(pendingDonationsAmount || 0),
    pendingPrayerRequests,
    publishedAnnouncementsCount,
    totalContactMessages,
    totalDonationsAmount: Number(totalDonationsAmount || 0),
    totalNewsletterSubscribers,
    totalPrayerRequests,
    unreadContactMessages,
    upcomingEventsCount,
  };
  const monthlyDonations = monthlyDonationsTotal.map((item) => ({
    month: item.month,
    total: Number(item.total || 0),
  }));

  response.json({
    data: {
      monthlyDonationsTotal: monthlyDonations,
      recentContactMessages,
      recentDonations,
      recentPrayerRequests,
      stats,
    },
    charts: {
      monthlyDonationsTotal: monthlyDonations,
    },
    recent: {
      contactMessages: recentContactMessages,
      donations: recentDonations,
      prayerRequests: recentPrayerRequests,
    },
    stats,
    success: true,
    status: "success",
  });
});
