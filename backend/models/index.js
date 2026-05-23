import sequelize from "../config/database.js";
import defineAdmin from "./Admin.js";
import defineAnnouncement from "./Announcement.js";
import defineAuditLog from "./AuditLog.js";
import defineButtonControl from "./ButtonControl.js";
import defineContactMessage from "./ContactMessage.js";
import defineDonation from "./Donation.js";
import defineEvent from "./Event.js";
import defineFailedLoginAttempt from "./FailedLoginAttempt.js";
import defineNewsletterSubscriber from "./NewsletterSubscriber.js";
import definePrayerRequest from "./PrayerRequest.js";
import defineSecurityEvent from "./SecurityEvent.js";
import defineSiteSetting from "./SiteSetting.js";
import defineUser from "./User.js";
import defineWebsiteSetting from "./WebsiteSetting.js";

const Admin = defineAdmin(sequelize);
const Announcement = defineAnnouncement(sequelize);
const AuditLog = defineAuditLog(sequelize);
const ButtonControl = defineButtonControl(sequelize);
const ContactMessage = defineContactMessage(sequelize);
const Donation = defineDonation(sequelize);
const Event = defineEvent(sequelize);
const FailedLoginAttempt = defineFailedLoginAttempt(sequelize);
const NewsletterSubscriber = defineNewsletterSubscriber(sequelize);
const PrayerRequest = definePrayerRequest(sequelize);
const SecurityEvent = defineSecurityEvent(sequelize);
const SiteSetting = defineSiteSetting(sequelize);
const User = defineUser(sequelize);
const WebsiteSetting = defineWebsiteSetting(sequelize);

Admin.hasMany(Announcement, { as: "announcements", foreignKey: "createdBy" });
Announcement.belongsTo(Admin, { as: "creator", foreignKey: "createdBy" });

Admin.hasMany(Event, { as: "events", foreignKey: "createdBy" });
Event.belongsTo(Admin, { as: "creator", foreignKey: "createdBy" });

Admin.hasMany(ButtonControl, { as: "buttonUpdates", foreignKey: "updatedBy" });
ButtonControl.belongsTo(Admin, { as: "updater", foreignKey: "updatedBy" });

User.hasMany(ContactMessage, { as: "contactMessages", foreignKey: "userId" });
ContactMessage.belongsTo(User, { as: "user", foreignKey: "userId" });

User.hasMany(PrayerRequest, { as: "prayerRequests", foreignKey: "userId" });
PrayerRequest.belongsTo(User, { as: "user", foreignKey: "userId" });

User.hasMany(Donation, { as: "donations", foreignKey: "userId" });
Donation.belongsTo(User, { as: "user", foreignKey: "userId" });

export {
  Admin,
  Announcement,
  AuditLog,
  ButtonControl,
  ContactMessage,
  Donation,
  Event,
  FailedLoginAttempt,
  NewsletterSubscriber,
  PrayerRequest,
  SecurityEvent,
  SiteSetting,
  User,
  WebsiteSetting,
  sequelize,
};

export default {
  Admin,
  Announcement,
  AuditLog,
  ButtonControl,
  ContactMessage,
  Donation,
  Event,
  FailedLoginAttempt,
  NewsletterSubscriber,
  PrayerRequest,
  SecurityEvent,
  SiteSetting,
  User,
  WebsiteSetting,
  sequelize,
};
