import * as XLSX from "xlsx";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["xlsx", "xls", "csv"];

function isEmpty(value) {
  return value === "" || value === null || value === undefined;
}

export async function readExcelFile(file) {
  if (!file) {
    throw new Error("File belum dipilih.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error("Gunakan file berformat .xlsx, .xls, atau .csv.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file maksimal adalah 10 MB.");
  }

  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  if (!workbook.SheetNames.length) {
    throw new Error("File tidak memiliki sheet yang dapat dibaca.");
  }

  const sheets = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const range = worksheet["!ref"];

    if (!range) {
      return {
        name: sheetName,
        rows: 0,
        columns: 0,
      };
    }

    const decodedRange = XLSX.utils.decode_range(range);

    return {
      name: sheetName,
      rows: Math.max(decodedRange.e.r, 0),
      columns: decodedRange.e.c + 1,
    };
  });

  return {
    workbook,
    sheets,
  };
}

export function getSheetRows(workbook, sheetName) {
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: true,
  });
}

export function analyzeRows(rows) {
  const columns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  );

  const totalCells = rows.length * columns.length;

  const emptyCells = rows.reduce((total, row) => {
    return (
      total +
      columns.filter((column) => isEmpty(row[column])).length
    );
  }, 0);

  const completeness =
    totalCells === 0
      ? 0
      : Math.round(((totalCells - emptyCells) / totalCells) * 100);

  const duplicateRows =
    rows.length -
    new Set(rows.map((row) => JSON.stringify(row))).size;

  const numericColumns = columns.filter((column) => {
    const values = rows
      .map((row) => row[column])
      .filter((value) => !isEmpty(value));

    if (values.length === 0) return false;

    const numericValues = values.filter(
      (value) =>
        typeof value === "number" ||
        (typeof value === "string" &&
          value.trim() !== "" &&
          !Number.isNaN(Number(value)))
    );

    return numericValues.length / values.length >= 0.7;
  });

  const categoryColumns = columns.filter(
    (column) => !numericColumns.includes(column)
  );

  const numericColumn = numericColumns[0] || null;
  const categoryColumn =
    categoryColumns[0] ||
    columns.find((column) => column !== numericColumn) ||
    null;

  const numericValues = numericColumn
    ? rows
        .map((row) => Number(row[numericColumn]))
        .filter((value) => !Number.isNaN(value))
    : [];

  const totalNumber = numericValues.reduce(
    (total, value) => total + value,
    0
  );

  const averageNumber =
    numericValues.length > 0
      ? totalNumber / numericValues.length
      : null;

  let topCategory = null;

  if (categoryColumn) {
    const categoryCounts = new Map();

    rows.forEach((row) => {
      const category = row[categoryColumn];

      if (isEmpty(category)) return;

      const name = String(category);

      categoryCounts.set(
        name,
        (categoryCounts.get(name) || 0) + 1
      );
    });

    topCategory =
      Array.from(categoryCounts.entries()).sort(
        (first, second) => second[1] - first[1]
      )[0]?.[0] || null;
  }

  let chartData = [];

  if (categoryColumn && numericColumn) {
    const groupedData = new Map();

    rows.forEach((row) => {
      const category = row[categoryColumn];
      const number = Number(row[numericColumn]);

      if (isEmpty(category) || Number.isNaN(number)) return;

      const name = String(category);

      groupedData.set(
        name,
        (groupedData.get(name) || 0) + number
      );
    });

    chartData = Array.from(groupedData.entries())
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((first, second) => second.value - first.value)
      .slice(0, 8);
  } else if (numericColumn) {
    chartData = rows
      .map((row, index) => ({
        name: `Baris ${index + 1}`,
        value: Number(row[numericColumn]),
      }))
      .filter((item) => !Number.isNaN(item.value))
      .slice(0, 8);
  } else if (categoryColumn) {
    const groupedData = new Map();

    rows.forEach((row) => {
      const category = row[categoryColumn];

      if (isEmpty(category)) return;

      const name = String(category);

      groupedData.set(
        name,
        (groupedData.get(name) || 0) + 1
      );
    });

    chartData = Array.from(groupedData.entries())
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((first, second) => second.value - first.value)
      .slice(0, 8);
  }

  return {
    columns,
    totalRows: rows.length,
    totalColumns: columns.length,
    emptyCells,
    completeness,
    duplicateRows,
    numericColumns,
    categoryColumns,
    numericColumn,
    categoryColumn,
    totalNumber,
    averageNumber,
    topCategory,
    chartData,
  };
}