import { adminApi } from "./adminApi";

export async function getNewsletterSubscribers(params = {}) {
  return adminApi.get("/newsletter/subscribers", { params });
}

export async function deleteNewsletterSubscriber(id) {
  return adminApi.delete(`/newsletter/subscribers/${id}`);
}

export const newsletterService = {
  delete: deleteNewsletterSubscriber,
  list: getNewsletterSubscribers,
};
