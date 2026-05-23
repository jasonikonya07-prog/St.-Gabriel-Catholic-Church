import { adminDelete, adminGet, publicPost, userPost } from "../api/axios";

export function subscribeToNewsletter(payload) {
  return userPost("/newsletter/subscribe", {
    email: payload.email || payload.newsletterEmail,
    fullName: payload.fullName || payload.name || undefined,
    source: payload.source || "website",
  });
}

export function unsubscribeFromNewsletter(email) {
  return publicPost("/newsletter/unsubscribe", { email });
}

export function getNewsletterSubscribers(params = {}) {
  return adminGet("/newsletter/subscribers", { params });
}

export function deleteNewsletterSubscriber(id) {
  return adminDelete(`/newsletter/subscribers/${id}`);
}
