export function getBrandParts(churchName = "St. Gabriel Church") {
  const name = String(churchName || "").trim() || "St. Gabriel Church";
  const suffixMatch = name.match(/^(.*?)(?:\s+(Catholic Church|Church|Parish))$/i);

  if (!suffixMatch) {
    return {
      primary: name,
      secondary: "Parish Website",
    };
  }

  return {
    primary: suffixMatch[1] || name,
    secondary: suffixMatch[2],
  };
}

export function getSocialHref(value, platform) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;

  const handle = text.replace(/^@/, "");
  const platformBase = {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
    tiktok: "https://www.tiktok.com/@",
    whatsapp: "https://wa.me/",
    youtube: "https://www.youtube.com/",
  };

  return `${platformBase[platform] || ""}${handle}`;
}
