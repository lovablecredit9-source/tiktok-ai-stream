function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportJson(filename: string, data: unknown) {
  download(`${filename}.json`, JSON.stringify(data, null, 2), "application/json");
}

export function exportCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    download(`${filename}.csv`, "", "text/csv");
    return;
  }
  const headers = Object.keys(rows[0]!);
  const escape = (value: unknown) => {
    const text = value == null ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
  download(`${filename}.csv`, csv, "text/csv;charset=utf-8");
}
