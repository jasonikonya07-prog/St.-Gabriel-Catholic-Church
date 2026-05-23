import {
  createEvent as createEventRequest,
  deleteEvent,
  getAllEvents,
  publishEvent as publishEventRequest,
  updateEvent as updateEventRequest,
} from "../../services/eventService";

function normalizeEvent(event = {}) {
  return {
    ...event,
    date: event.date ?? event.eventDate ?? "",
    featured: Boolean(event.featured ?? event.isFeatured),
    published: Boolean(event.published ?? event.isPublished),
  };
}

function normalizeEventResponse(response) {
  if (!response) return response;
  const events = response.events || response.data?.events;
  const event = response.event || response.data?.event;

  if (Array.isArray(events)) {
    const normalized = events.map(normalizeEvent);
    return {
      ...response,
      data: { ...(response.data || {}), events: normalized },
      events: normalized,
    };
  }

  if (event) {
    const normalized = normalizeEvent(event);
    return {
      ...response,
      data: { ...(response.data || {}), event: normalized },
      event: normalized,
    };
  }

  return normalizeEvent(response);
}

function toEventPayload(payload = {}) {
  return {
    ...payload,
    eventDate: payload.eventDate ?? payload.date,
    isFeatured: payload.isFeatured ?? payload.featured,
    isPublished: payload.isPublished ?? payload.published,
  };
}

export async function getEvents(params = {}) {
  return normalizeEventResponse(await getAllEvents(params));
}

export { deleteEvent };

export async function createEvent(payload) {
  return normalizeEventResponse(await createEventRequest(toEventPayload(payload)));
}

export async function updateEvent(id, payload) {
  return normalizeEventResponse(await updateEventRequest(id, toEventPayload(payload)));
}

export async function publishEvent(id, published) {
  return normalizeEventResponse(await publishEventRequest(id, published));
}

export const eventService = {
  create: createEvent,
  delete: deleteEvent,
  list: getEvents,
  publish: publishEvent,
  update: updateEvent,
};
