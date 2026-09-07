"use client";

import { useMemo, useState } from "react";

function isEmpty(value) {
  return (
    value === "" ||
    value === null ||
    value === undefined
  );
}

function normalizeColumnName(value) {
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_]/gu, "");

  return normalized || "column";
}

function inspectData(rows) {
  const allColumns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  );

  const completelyEmptyRows = rows.filter((row) =>
    Object.values(row).every(isEmpty)
  ).length;

  let trimIssues = 0;
  let numericTextIssues = 0;

  rows.forEach((row) => {
    Object.values(row).forEach((value) => {
      if (
        typeof value === "string" &&
        value !== value.trim()
      ) {
        trimIssues += 1;
      }

      if (
        typeof value === "string" &&
        value.trim() !== "" &&
        /^-?\d+(\.\d+)?$/.test(value.trim())
      ) {
        numericTextIssues += 1;
      }
    });
  });

  const duplicateRows =
    rows.length -
    new Set(rows.map((row) => JSON.stringify(row))).size;

  const columnNameIssues = allColumns.filter(
    (column) => column !== normalizeColumnName(column)
  ).length;

  return {
    completelyEmptyRows,
    trimIssues,
    numericTextIssues,
    duplicateRows,
    columnNameIssues,
  };
}

export default function CleanPanel({
  rows,
  onRowsChange,
}) {
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");

  const issues = useMemo(() => inspectData(rows), [rows]);

  function saveHistory(label) {
    setHistory((currentHistory) => [
      ...currentHistory,
      {
        label,
        rows,
      },
    ]);
  }

  function applyTrimText() {
    saveHistory("Trim text");

    const cleanedRows = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([column, value]) => [
          column,
          typeof value === "string"
            ? value.trim()
            : value,
        ])
      )
    );

    onRowsChange(cleanedRows);
    setMessage(
      `${issues.trimIssues} nilai teks berhasil dirapikan.`
    );
  }

  function removeEmptyRows() {
    saveHistory("Remove empty rows");

    const cleanedRows = rows.filter(
      (row) => !Object.values(row).every(isEmpty)
    );

    onRowsChange(cleanedRows);
    setMessage(
      `${issues.completelyEmptyRows} baris kosong berhasil dihapus.`
    );
  }

  function removeDuplicateRows() {
    saveHistory("Remove duplicate rows");

    const usedRows = new Set();

    const cleanedRows = rows.filter((row) => {
      const rowKey = JSON.stringify(row);

      if (usedRows.has(rowKey)) {
        return false;
      }

      usedRows.add(rowKey);
      return true;
    });

    onRowsChange(cleanedRows);
    setMessage(
      `${issues.duplicateRows} baris duplikat berhasil dihapus.`
    );
  }

  function convertNumericText() {
    saveHistory("Convert numeric text");

    const cleanedRows = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([column, value]) => {
          if (
            typeof value === "string" &&
            /^-?\d+(\.\d+)?$/.test(value.trim())
          ) {
            return [column, Number(value.trim())];
          }

          return [column, value];
        })
      )
    );

    onRowsChange(cleanedRows);
    setMessage(
      `${issues.numericTextIssues} teks angka berhasil diubah menjadi number.`
    );
  }

  function normalizeColumnNames() {
    saveHistory("Normalize column names");

    const columns = Array.from(
      new Set(rows.flatMap((row) => Object.keys(row)))
    );

    const usedNames = new Set();
    const columnMapping = new Map();

    columns.forEach((column) => {
      const baseName = normalizeColumnName(column);
      let finalName = baseName;
      let number = 2;

      while (usedNames.has(finalName)) {
        finalName = `${baseName}_${number}`;
        number += 1;
      }

      usedNames.add(finalName);
      columnMapping.set(column, finalName);
    });

    const cleanedRows = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([column, value]) => [
          columnMapping.get(column) || column,
          value,
        ])
      )
    );

    onRowsChange(cleanedRows);
    setMessage(
      `${issues.columnNameIssues} nama kolom berhasil dinormalisasi.`
    );
  }

  function undoLastChange() {
    if (history.length === 0) return;

    const lastChange = history[history.length - 1];

    onRowsChange(lastChange.rows);
    setHistory((currentHistory) =>
      currentHistory.slice(0, -1)
    );

    setMessage(
      `Perubahan "${lastChange.label}" berhasil dibatalkan.`
    );
  }

  const cleanupActions = [
    {
      id: "trim",
      number: "01",
      title: "Trim text",
      description:
        "Menghapus spasi tambahan di awal dan akhir teks.",
      count: issues.trimIssues,
      countLabel: "nilai teks",
      action: applyTrimText,
    },
    {
      id: "empty",
      number: "02",
      title: "Remove empty rows",
      description:
        "Menghapus baris yang seluruh isinya kosong.",
      count: issues.completelyEmptyRows,
      countLabel: "baris kosong",
      action: removeEmptyRows,
    },
    {
      id: "duplicate",
      number: "03",
      title: "Remove duplicate rows",
      description:
        "Menghapus baris dengan isi yang sama persis.",
      count: issues.duplicateRows,
      countLabel: "duplikat",
      action: removeDuplicateRows,
    },
    {
      id: "number",
      number: "04",
      title: "Convert numeric text",
      description:
        "Mengubah teks angka menjadi tipe number.",
      count: issues.numericTextIssues,
      countLabel: "teks angka",
      action: convertNumericText,
    },
    {
      id: "column",
      number: "05",
      title: "Normalize column names",
      description:
        "Mengubah nama kolom menjadi format snake_case.",
      count: issues.columnNameIssues,
      countLabel: "nama kolom",
      action: normalizeColumnNames,
    },
  ];

  return (
    <div className="clean-page">
      <section className="feature-page-heading">
        <div>
          <span>03 / CLEAN &amp; TRANSFORM</span>

          <h2>
            Find the noise.
            <br />
            <i>Keep control.</i>
          </h2>
        </div>

        <div className="cleanup-summary">
          <span>Transformation history</span>
          <strong>{history.length}</strong>
          <small>perubahan dalam sesi ini</small>

          <button
            type="button"
            onClick={undoLastChange}
            disabled={history.length === 0}
          >
            Undo last change
          </button>
        </div>
      </section>

      {message && (
        <div className="cleanup-message" role="status">
          <span>✓</span>
          {message}
        </div>
      )}

      <section className="cleanup-grid">
        {cleanupActions.map((item) => (
          <article
            className={`cleanup-card ${
              item.count > 0 ? "has-issue" : ""
            }`}
            key={item.id}
          >
            <div className="cleanup-card-number">
              {item.number}
            </div>

            <div className="cleanup-card-content">
              <span className="cleanup-status">
                {item.count > 0
                  ? "Issue detected"
                  : "No issue"}
              </span>

              <h3>{item.title}</h3>
              <p>{item.description}</p>

              <div className="cleanup-card-footer">
                <span>
                  <strong>{item.count}</strong>
                  {item.countLabel}
                </span>

                <button
                  type="button"
                  onClick={item.action}
                  disabled={item.count === 0}
                >
                  Apply cleanup
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}