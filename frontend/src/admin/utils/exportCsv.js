function normalizeFilename(filename) {
  const safeName = String(filename || "st-gabriel-export").trim() || "st-gabriel-export";
  return safeName.toLowerCase().endsWith(".csv") ? safeName : `${safeName}.csv`;
}

function escapeCsvValue(value) {
  if (value === undefined || value === null) return "";

  const text = Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function convertArrayToCsv(data = []) {
  if (!Array.isArray(data) || !data.length) return "";

  const headers = Array.from(
    data.reduce((keys, row) => {
      Object.keys(row || {}).forEach((key) => keys.add(key));
      return keys;
    }, new Set()),
  );

  const headerRow = headers.map(escapeCsvValue).join(",");
  const rows = data.map((row) => headers.map((header) => escapeCsvValue(row?.[header])).join(","));

  return [headerRow, ...rows].join("\n");
}

export function exportToCsv(filename, data = []) {
  const csv = convertArrayToCsv(data);

  if (!csv || typeof document === "undefined") return false;

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = normalizeFilename(filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}

export const exportCsv = exportToCsv;
