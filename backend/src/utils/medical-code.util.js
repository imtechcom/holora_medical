const db = require("../config/db");

const ENTITY_CONFIG = {
  branch: {
    table: "branch",
    column: "code",
    suffix: "BR",
    width: 4,
    where: "deleted_at IS NULL",
  },
  doctor: {
    table: "doctor",
    column: "doctor_code",
    suffix: "DT",
    width: 4,
  },
  patient: {
    table: "patient",
    column: "patient_code",
    suffix: "PT",
    width: 4,
  },
  prescription: {
    table: "prescription",
    column: "prescription_code",
    suffix: "RX",
    width: 4,
  },
};

const formatDateCode = (date = new Date()) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  return `${day}${month}${year}`;
};

const buildCodePrefix = (suffix, dateCode) => `HLR_MED_${dateCode}_${suffix}`;

const buildMedicalCode = (suffix, dateCode, sequence, width) => {
  const sequenceText = String(sequence).padStart(width, "0");
  return `${buildCodePrefix(suffix, dateCode)}${sequenceText}`;
};

const generateMedicalCode = (entity, callback) => {
  const config = ENTITY_CONFIG[entity];

  if (!config) {
    callback(new Error(`Unsupported entity for code generation: ${entity}`));
    return;
  }

  const dateCode = formatDateCode();
  const prefix = buildCodePrefix(config.suffix, dateCode);
  const conditions = [
    `${config.column} LIKE ?`,
  ];

  if (config.where) {
    conditions.push(config.where);
  }

  const sql = `
    SELECT MAX(CAST(SUBSTRING(${config.column}, ${prefix.length + 1}) AS UNSIGNED)) AS maxSequence
    FROM ${config.table}
    WHERE ${conditions.join(" AND ")}
  `;

  db.query(sql, [`${prefix}%`], (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    const nextSequence = Number(results?.[0]?.maxSequence || 0) + 1;
    callback(null, buildMedicalCode(config.suffix, dateCode, nextSequence, config.width));
  });
};

module.exports = {
  buildMedicalCode,
  formatDateCode,
  generateMedicalCode,
};