"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

function createSafeName(fileName) {
  return String(fileName || "spreadsheet")
    .replace(/\.[^/.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

export default function ExportPanel({
  rows,
  activeSheet,
  fileName,
}) {
  const [message, setMessage] = useState("");

  const columns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  );

  const safeName =
    createSafeName(fileName) || "spreadsheet";

  function exportXlsx() {
    if (rows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      activeSheet.slice(0, 31) || "Cleaned Data"
    );

    XLSX.writeFile(
      workbook,
      `cleaned-${safeName}.xlsx`
    );

    setMessage(
      `cleaned-${safeName}.xlsx berhasil dibuat.`
    );
  }

  function exportCsv() {
    if (rows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob(
      [`\uFEFF${csvContent}`],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = `cleaned-${safeName}.csv`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(downloadUrl);

    setMessage(
      `cleaned-${safeName}.csv berhasil dibuat.`
    );
  }

  return (
    <div className="export-page">
      <section className="feature-page-heading">
        <div>
          <span>04 / EXPORT</span>

          <h2>
            Ready to leave
            <br />
            <i>the workspace.</i>
          </h2>
        </div>

        <p className="export-description">
          Periksa ringkasan data, kemudian pilih format
          file yang ingin diunduh.
        </p>
      </section>

      {message && (
        <div className="cleanup-message" role="status">
          <span>✓</span>
          {message}
        </div>
      )}

      <section className="export-layout">
        <article className="export-summary-panel">
          <span className="export-small-label">
            Export summary
          </span>

          <h3>{fileName}</h3>

          <dl>
            <div>
              <dt>Active sheet</dt>
              <dd>{activeSheet}</dd>
            </div>

            <div>
              <dt>Total rows</dt>
              <dd>{rows.length}</dd>
            </div>

            <div>
              <dt>Total columns</dt>
              <dd>{columns.length}</dd>
            </div>

            <div>
              <dt>Processing</dt>
              <dd>Local browser</dd>
            </div>
          </dl>
        </article>

        <div className="export-options">
          <article className="export-option-card export-xlsx">
            <span className="file-extension">.XLSX</span>

            <div>
              <h3>Excel Workbook</h3>

              <p>
                Cocok jika data ingin dibuka dan diedit
                kembali menggunakan Microsoft Excel.
              </p>
            </div>

            <button
              type="button"
              onClick={exportXlsx}
              disabled={rows.length === 0}
            >
              Download XLSX
              <span>↗</span>
            </button>
          </article>

          <article className="export-option-card export-csv">
            <span className="file-extension">.CSV</span>

            <div>
              <h3>Comma Separated Values</h3>

              <p>
                Format sederhana yang cocok untuk dipindahkan
                ke aplikasi atau database lain.
              </p>
            </div>

            <button
              type="button"
              onClick={exportCsv}
              disabled={rows.length === 0}
            >
              Download CSV
              <span>↗</span>
            </button>
          </article>
        </div>
      </section>
    </div>
  );
}