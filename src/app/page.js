"use client";

import dynamic from "next/dynamic";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import CleanPanel from "../components/CleanPanel";
import ExportPanel from "../components/ExportPanel";

import {
  analyzeRows,
  getSheetRows,
  readExcelFile,
} from "../lib/excel";

const DataScene = dynamic(
  () => import("../components/DataScene"),
  {
    ssr: false,
    loading: () => (
      <div className="scene-loading">
        Menyiapkan visual data...
      </div>
    ),
  }
);

const VIEW_TITLES = {
  overview: "Data overview",
  explorer: "Data explorer",
  clean: "Clean & transform",
  export: "Export data",
};

function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(value)
  ) {
    return "N/A";
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCellValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "N/A";
  }

  if (value instanceof Date) {
    return value.toLocaleDateString("id-ID");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export default function Home() {
  const fileInputRef = useRef(null);
  const uploadCommitTimerRef = useRef(null);
  const sceneCardRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [rows, setRows] = useState([]);

  const [activeView, setActiveView] =
    useState("overview");

  const [search, setSearch] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [uploadState, setUploadState] = useState("default");
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (uploadCommitTimerRef.current) {
        window.clearTimeout(uploadCommitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const preferenceFrame = window.requestAnimationFrame(() => {
      const savedTheme = window.localStorage.getItem(
        "dataflow-theme"
      );

      if (
        savedTheme === "light" ||
        savedTheme === "dark"
      ) {
        setTheme(savedTheme);
        return;
      }

      if (
        window.matchMedia(
          "(prefers-color-scheme: light)"
        ).matches
      ) {
        setTheme("light");
      }
    });

    return () => {
      window.cancelAnimationFrame(preferenceFrame);
    };
  }, []);

  const analysis = useMemo(() => {
    return analyzeRows(rows);
  }, [rows]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return rows;
    }

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        formatCellValue(value)
          .toLowerCase()
          .includes(keyword)
      )
    );
  }, [rows, search]);

  function openFilePicker() {
    if (uploadState === "uploading") return;

    fileInputRef.current?.click();
  }

  function toggleTheme() {
    setTheme((currentTheme) => {
      const nextTheme =
        currentTheme === "dark" ? "light" : "dark";

      window.localStorage.setItem("dataflow-theme", nextTheme);

      return nextTheme;
    });
  }

  async function processFile(file) {
    if (!file) return;

    if (uploadCommitTimerRef.current) {
      window.clearTimeout(uploadCommitTimerRef.current);
    }

    setError("");
    setUploadState("uploading");
    setUploadStatus("Membaca struktur spreadsheet");

    try {
      const result = await readExcelFile(file);

      setUploadStatus("Mendeteksi kolom dan sheet");

      const firstSheet = result.sheets[0]?.name;

      if (!firstSheet) {
        throw new Error(
          "File tidak memiliki sheet yang dapat dibaca."
        );
      }

      const firstRows = getSheetRows(
        result.workbook,
        firstSheet
      );

      setUploadStatus("File siap dibersihkan");
      setUploadState("success");

      uploadCommitTimerRef.current = window.setTimeout(() => {
        setSelectedFile(file);
        setWorkbook(result.workbook);
        setSheets(result.sheets);
        setActiveSheet(firstSheet);
        setRows(firstRows);
        setSearch("");
        setActiveView("clean");
      }, 920);
    } catch (fileError) {
      const message =
        fileError instanceof Error
          ? fileError.message
          : "File gagal dibaca.";

      setError(message);
      setUploadStatus("Periksa format atau ukuran file");
      setUploadState("error");
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    processFile(file);

    event.target.value = "";
  }

  function handleDragOver(event) {
    event.preventDefault();

    if (uploadState === "uploading") return;

    setDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();

    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDragActive(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);

    if (uploadState === "uploading") return;

    const file = event.dataTransfer.files?.[0];

    processFile(file);
  }

  function handleScenePointerMove(event) {
    const sceneCard = sceneCardRef.current;

    if (!sceneCard) return;

    const bounds = sceneCard.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 12;

    sceneCard.style.setProperty("--pointer-x", `${x.toFixed(2)}px`);
    sceneCard.style.setProperty("--pointer-y", `${y.toFixed(2)}px`);
  }

  function resetSceneParallax() {
    const sceneCard = sceneCardRef.current;

    if (!sceneCard) return;

    sceneCard.style.setProperty("--pointer-x", "0px");
    sceneCard.style.setProperty("--pointer-y", "0px");
  }

  function handleSheetChange(event) {
    const sheetName = event.target.value;

    if (!workbook) return;

    const newRows = getSheetRows(
      workbook,
      sheetName
    );

    setActiveSheet(sheetName);
    setRows(newRows);
    setSearch("");
    setActiveView("overview");
  }

  function resetWorkspace() {
    setSelectedFile(null);
    setWorkbook(null);
    setSheets([]);
    setActiveSheet("");
    setRows([]);
    setSearch("");
    setError("");
    setUploadStatus("");
    setUploadState("default");
    setActiveView("overview");
  }

  if (!workbook) {
    const isUploading = uploadState === "uploading";
    const isSuccess = uploadState === "success";
    const isError = uploadState === "error";

    const uploadTitle = isUploading
      ? uploadStatus || "Membaca spreadsheet"
      : isSuccess
        ? "Spreadsheet siap diproses"
        : isError
          ? "File belum dapat dibaca"
          : "Tarik spreadsheet ke sini";

    const uploadDescription = isUploading
      ? "Mohon tunggu sebentar"
      : isSuccess
        ? "Membuka tahap Clean"
        : isError
          ? uploadStatus
          : "Atau tekan tombol untuk memilih file";

    return (
      <main className="landing-shell" data-theme={theme}>
        <div className="landing-light" aria-hidden="true" />
        <div className="landing-grain" aria-hidden="true" />
        <header className="topbar">
          <a
            className="brand"
            href="#"
            aria-label="DataFlow Analytics"
          >
            <span className="brand-mark">
              <span />
              <span />
              <span />
            </span>

            <span>
              <strong>DataFlow</strong>
              <small>Analytics</small>
            </span>
          </a>

          <div className="topbar-tools">
            <span className="topbar-status">
              Diproses secara lokal
            </span>

            <button
              className="theme-toggle"
              type="button"
              aria-label={
                theme === "dark"
                  ? "Gunakan tema terang"
                  : "Gunakan tema gelap"
              }
              onClick={toggleTheme}
            >
              <span className="theme-toggle-mark" aria-hidden="true" />
              {theme === "dark" ? "Terang" : "Gelap"}
            </button>
          </div>
        </header>

        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">
              Excel analytics workspace
            </p>

            <h1 aria-label="Your spreadsheet has a story.">
              <span className="hero-line-mask">
                <span className="hero-line">Your spreadsheet</span>
              </span>
              <span className="hero-line-mask">
                <span className="hero-line hero-line-outline">
                  has a story.
                </span>
              </span>
            </h1>

            <p className="hero-description">
              DataFlow membaca, membersihkan, menganalisis,
              lalu mengubah spreadsheet menjadi insight yang
              jernih dan siap ditindaklanjuti.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                type="button"
                onClick={openFilePicker}
                disabled={isUploading}
              >
                {isUploading ? "Membaca file" : "Pilih file Excel"}

                <span className="button-arrow" aria-hidden="true">↗</span>
              </button>

              <span className="file-limit">
                XLSX, XLS, CSV
                <small>Maksimal 10 MB</small>
              </span>
            </div>

            <div className="privacy-note">
              <span className="privacy-icon" aria-hidden="true" />

              <p>
                <strong>Data tetap di perangkatmu</strong>
                File diproses di browser dan tidak dikirim ke server.
              </p>
            </div>
          </div>

          <div
            className="scene-card"
            ref={sceneCardRef}
            onPointerMove={handleScenePointerMove}
            onPointerLeave={resetSceneParallax}
          >
            <div className="scene-drift">
              <div className="scene-grid" />
              <div className="scene-label">
                <span>Visual data</span>
              </div>

              <div className="scene-canvas">
                <DataScene />
              </div>

            </div>

            <div
              className={`upload-panel upload-${uploadState} ${
                dragActive ? "upload-panel-active" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <span
                className={`upload-symbol ${
                  isSuccess ? "upload-symbol-success" : ""
                } ${isUploading ? "upload-symbol-loading" : ""}`}
                aria-hidden="true"
              />

              <div className="upload-copy">
                <strong>{uploadTitle}</strong>
                <span id="upload-help">{uploadDescription}</span>
                {isUploading && <i className="upload-progress" />}
              </div>

              <button
                type="button"
                className="upload-button"
                aria-describedby="upload-help"
                onClick={openFilePicker}
                disabled={isUploading || isSuccess}
              >
                Browse
              </button>
            </div>

            {isError && (
              <p
                className="error-message"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        </section>

        <ol className="process-strip" aria-label="Alur kerja DataFlow">
          <li className="is-current">
            <strong>Upload</strong>
          </li>
          <li>
            <strong>Clean</strong>
          </li>
          <li>
            <strong>Analyse</strong>
          </li>
          <li>
            <strong>Export</strong>
          </li>
        </ol>

        <input
          ref={fileInputRef}
          className="hidden-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
        />
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="dashboard-logo">
            <i />
            <i />
            <i />
          </span>

          <span>
            <strong>DataFlow</strong>
            <small>Analytics</small>
          </span>
        </div>

        <div className="active-file">
          <span className="active-file-label">
            Active file
          </span>

          <strong>{selectedFile?.name}</strong>
          <span>{activeSheet}</span>
        </div>

        <nav
          className="dashboard-navigation"
          aria-label="Dashboard navigation"
        >
          <button
            type="button"
            className={
              activeView === "overview"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveView("overview")
            }
          >
            <span>01</span>
            Overview
          </button>

          <button
            type="button"
            className={
              activeView === "explorer"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveView("explorer")
            }
          >
            <span>02</span>
            Data Explorer
          </button>

          <button
            type="button"
            className={
              activeView === "clean"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveView("clean")
            }
          >
            <span>03</span>
            Clean &amp; Transform
          </button>

          <button
            type="button"
            className={
              activeView === "export"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveView("export")
            }
          >
            <span>04</span>
            Export
          </button>
        </nav>

        <div className="local-processing">
          <span className="status-dot" />

          <p>
            <strong>Local processing</strong>
            File tidak dikirim ke server
          </p>
        </div>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-section-label">
              Workspace / {activeView}
            </span>

            <h1>
              {VIEW_TITLES[activeView]}
            </h1>
          </div>

          <div className="dashboard-actions">
            <label>
              <span>Sheet</span>

              <select
                value={activeSheet}
                onChange={handleSheetChange}
              >
                {sheets.map((sheet) => (
                  <option
                    key={sheet.name}
                    value={sheet.name}
                  >
                    {sheet.name} ({sheet.rows} rows)
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={openFilePicker}
            >
              Replace file
            </button>

            <button
              type="button"
              className="reset-button"
              onClick={resetWorkspace}
            >
              Close
            </button>
          </div>
        </header>

        {activeView === "overview" && (
          <div className="overview-page">
            <section className="overview-intro">
              <div>
                <span className="section-number">
                  01 / OVERVIEW
                </span>

                <h2>
                  Clean the noise.
                  <br />
                  <span>Keep the signal.</span>
                </h2>
              </div>

              <p>
                Data dibaca langsung dari sheet{" "}
                <strong>{activeSheet}</strong>.
                Semua angka di bawah berasal dari
                file yang kamu upload.
              </p>
            </section>

            <section className="kpi-grid">
              <article className="kpi-card kpi-primary">
                <span>Total rows</span>

                <strong>
                  {formatNumber(
                    analysis.totalRows
                  )}
                </strong>

                <small>
                  {analysis.totalColumns} kolom
                  ditemukan
                </small>
              </article>

              <article className="kpi-card">
                <span>Complete fields</span>

                <strong>
                  {analysis.completeness}%
                </strong>

                <small>
                  {analysis.emptyCells} nilai kosong
                </small>
              </article>

              <article className="kpi-card">
                <span>
                  Average{" "}
                  {analysis.numericColumn
                    ? `- ${analysis.numericColumn}`
                    : ""}
                </span>

                <strong>
                  {formatNumber(
                    analysis.averageNumber
                  )}
                </strong>

                <small>
                  {analysis.numericColumn
                    ? "Berdasarkan kolom angka pertama"
                    : "Kolom angka belum ditemukan"}
                </small>
              </article>

              <article className="kpi-card kpi-warning">
                <span>Duplicate rows</span>

                <strong>
                  {formatNumber(
                    analysis.duplicateRows
                  )}
                </strong>

                <small>
                  Baris dengan isi yang sama
                </small>
              </article>
            </section>

            <section className="analytics-grid">
              <article className="chart-panel">
                <div className="panel-heading">
                  <div>
                    <span>
                      Data distribution
                    </span>

                    <h3>
                      {analysis.categoryColumn ||
                        "Category"}

                      {analysis.numericColumn
                        ? ` × ${analysis.numericColumn}`
                        : ""}
                    </h3>
                  </div>

                  <span className="live-badge">
                    Live data
                  </span>
                </div>

                {analysis.chartData.length > 0 ? (
                  <div className="chart-container">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={analysis.chartData}
                      >
                        <CartesianGrid
                          stroke="rgba(16, 24, 32, 0.08)"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                          tickFormatter={(value) => {
                            const text =
                              String(value);

                            return text.length > 12
                              ? `${text.slice(0, 12)}…`
                              : text;
                          }}
                        />

                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                        />

                        <Tooltip
                          cursor={{
                            fill: "rgba(39, 211, 194, 0.08)",
                          }}
                          contentStyle={{
                            background: "#101820",
                            border: "none",
                            color: "#f5f4ef",
                          }}
                        />

                        <Bar
                          dataKey="value"
                          fill="#27d3c2"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="chart-empty">
                    Diagram belum dapat dibuat
                    dari struktur data ini.
                  </div>
                )}
              </article>

              <article className="health-panel">
                <span className="panel-small-label">
                  Data health
                </span>

                <div className="health-score">
                  <strong>
                    {analysis.completeness}
                  </strong>

                  <span>%</span>
                </div>

                <p>
                  Kelengkapan data dihitung
                  berdasarkan seluruh kolom dan
                  baris pada sheet aktif.
                </p>

                <div className="health-progress">
                  <span
                    style={{
                      width: `${analysis.completeness}%`,
                    }}
                  />
                </div>

                <ul>
                  <li>
                    <span>Rows</span>

                    <strong>
                      {analysis.totalRows}
                    </strong>
                  </li>

                  <li>
                    <span>Columns</span>

                    <strong>
                      {analysis.totalColumns}
                    </strong>
                  </li>

                  <li>
                    <span>Empty values</span>

                    <strong>
                      {analysis.emptyCells}
                    </strong>
                  </li>

                  <li>
                    <span>Top category</span>

                    <strong>
                      {analysis.topCategory || "N/A"}
                    </strong>
                  </li>
                </ul>
              </article>
            </section>
          </div>
        )}

        {activeView === "explorer" && (
          <div className="explorer-page">
            <section className="explorer-toolbar">
              <div>
                <span>Data preview</span>

                <h2>{activeSheet}</h2>
              </div>

              <label className="search-box">
                <span>Search</span>

                <input
                  type="search"
                  placeholder="Cari isi data..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </label>
            </section>

            <section className="table-panel">
              {analysis.columns.length > 0 ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th className="row-number">
                          #
                        </th>

                        {analysis.columns.map(
                          (column) => (
                            <th key={column}>
                              {column}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRows
                        .slice(0, 100)
                        .map((row, rowIndex) => (
                          <tr
                            key={`${rowIndex}-${JSON.stringify(
                              row
                            )}`}
                          >
                            <td className="row-number">
                              {rowIndex + 1}
                            </td>

                            {analysis.columns.map(
                              (column) => (
                                <td key={column}>
                                  {formatCellValue(
                                    row[column]
                                  )}
                                </td>
                              )
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="table-empty">
                  Sheet ini belum memiliki data.
                </div>
              )}

              <footer className="table-footer">
                <span>
                  Menampilkan maksimal 100 dari{" "}
                  {filteredRows.length} baris
                </span>

                <span>
                  {analysis.totalColumns} columns
                </span>
              </footer>
            </section>
          </div>
        )}

        {activeView === "clean" && (
          <CleanPanel
            key={activeSheet}
            rows={rows}
            onRowsChange={setRows}
          />
        )}

        {activeView === "export" && (
          <ExportPanel
            rows={rows}
            activeSheet={activeSheet}
            fileName={
              selectedFile?.name ||
              "spreadsheet.xlsx"
            }
          />
        )}
      </section>

      <input
        ref={fileInputRef}
        className="hidden-input"
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
      />
    </main>
  );
}
