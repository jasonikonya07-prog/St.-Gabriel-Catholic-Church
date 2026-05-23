import {
  createAnnouncement as createAnnouncementRequest,
  deleteAnnouncement,
  getAllAnnouncements,
  publishAnnouncement as publishAnnouncementRequest,
  updateAnnouncement as updateAnnouncementRequest,
} from "../../services/announcementService";

function normalizeAnnouncement(announcement = {}) {
  return {
    ...announcement,
    fullContent: announcement.fullContent ?? announcement.content ?? "",
    published: Boolean(announcement.published ?? announcement.isPublished),
  };
}

function normalizeAnnouncementResponse(response) {
  if (!response) return response;
  const announcements = response.announcements || response.data?.announcements;
  const announcement = response.announcement || response.data?.announcement;

  if (Array.isArray(announcements)) {
    const normalized = announcements.map(normalizeAnnouncement);
    return {
      ...response,
      announcements: normalized,
      data: { ...(response.data || {}), announcements: normalized },
    };
  }

  if (announcement) {
    const normalized = normalizeAnnouncement(announcement);
    return {
      ...response,
      announcement: normalized,
      data: { ...(response.data || {}), announcement: normalized },
    };
  }

  return normalizeAnnouncement(response);
}

function toAnnouncementPayload(payload = {}) {
  return {
    ...payload,
    content: payload.content ?? payload.fullContent,
    isPublished: payload.isPublished ?? payload.published,
  };
}

export async function getAnnouncements(params = {}) {
  return normalizeAnnouncementResponse(await getAllAnnouncements(params));
}

export { deleteAnnouncement };

export async function createAnnouncement(payload) {
  return normalizeAnnouncementResponse(await createAnnouncementRequest(toAnnouncementPayload(payload)));
}

export async function updateAnnouncement(id, payload) {
  return normalizeAnnouncementResponse(await updateAnnouncementRequest(id, toAnnouncementPayload(payload)));
}

export async function publishAnnouncement(id, published) {
  return normalizeAnnouncementResponse(await publishAnnouncementRequest(id, published));
}

export function saveAnnouncement(payload) {
  return payload.id ? updateAnnouncement(payload.id, payload) : createAnnouncement(payload);
}

export const announcementService = {
  create: createAnnouncement,
  delete: deleteAnnouncement,
  list: getAnnouncements,
  publish: publishAnnouncement,
  save: saveAnnouncement,
  update: updateAnnouncement,
};
