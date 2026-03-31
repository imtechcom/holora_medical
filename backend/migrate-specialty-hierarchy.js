const mysql = require("mysql2/promise");
require("dotenv").config();

const addParentColumnSql = `
  ALTER TABLE specialty
  ADD COLUMN parent_id BIGINT UNSIGNED NULL AFTER code;
`;

const addParentIndexSql = `
  CREATE INDEX idx_specialty_parent_id ON specialty(parent_id);
`;

const addParentFkSql = `
  ALTER TABLE specialty
  ADD CONSTRAINT fk_specialty_parent
  FOREIGN KEY (parent_id)
  REFERENCES specialty(id)
  ON DELETE SET NULL;
`;

const hierarchySeed = [
  {
    parent: {
      code: "INTERNAL_MEDICINE",
      name: "Nội khoa",
      description: "Điều trị bệnh bằng thuốc",
      status: "active",
    },
    children: [
      { code: "CARDIOLOGY", name: "Tim mạch" },
      { code: "GASTROENTEROLOGY", name: "Tiêu hóa" },
      { code: "RESPIRATORY", name: "Hô hấp" },
      { code: "ENDOCRINOLOGY", name: "Nội tiết" },
      { code: "NEPHRO_UROLOGY", name: "Thận - Tiết niệu" },
      { code: "RHEUMATOLOGY", name: "Xương khớp" },
      { code: "HEMATOLOGY", name: "Huyết học" },
      { code: "INFECTIOUS_DISEASE", name: "Truyền nhiễm/Nhiệt đới" },
    ],
  },
  {
    parent: {
      code: "SURGERY",
      name: "Ngoại khoa",
      description: "Điều trị bệnh bằng phẫu thuật",
      status: "active",
    },
    children: [
      { code: "GENERAL_SURGERY", name: "Ngoại tổng quát" },
      { code: "NEUROSURGERY", name: "Ngoại thần kinh" },
      { code: "THORACIC_SURGERY", name: "Ngoại lồng ngực" },
      { code: "ORTHOPEDIC_TRAUMA", name: "Chấn thương chỉnh hình" },
      { code: "PEDIATRIC_SURGERY", name: "Ngoại nhi" },
    ],
  },
];

const isIgnorableError = (err) => {
  if (!err) return false;
  const code = err.code || "";
  const msg = (err.message || "").toLowerCase();
  return (
    code === "ER_DUP_FIELDNAME" ||
    code === "ER_DUP_KEYNAME" ||
    code === "ER_FK_DUP_NAME" ||
    code === "ER_CANT_CREATE_TABLE" ||
    msg.includes("duplicate column") ||
    msg.includes("already exists")
  );
};

const ensureSpecialty = async (connection, { code, name, description, status, parentId = null }) => {
  const [existingRows] = await connection.query(
    `SELECT id, code, name FROM specialty WHERE code = ? OR name = ? LIMIT 1`,
    [code, name]
  );

  if (existingRows.length) {
    const id = existingRows[0].id;
    await connection.query(
      `
        UPDATE specialty
        SET
          code = ?,
          name = ?,
          description = ?,
          status = ?,
          parent_id = ?,
          updated_at = NOW(),
          deleted_at = NULL
        WHERE id = ?
      `,
      [code, name, description || null, status || "active", parentId, id]
    );

    return id;
  }

  const [insertResult] = await connection.query(
    `
      INSERT INTO specialty (
        name,
        code,
        parent_id,
        description,
        status,
        doctor_count,
        created_at,
        updated_at,
        deleted_at
      )
      VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW(), NULL)
    `,
    [name, code, parentId, description || null, status || "active"]
  );

  return insertResult.insertId;
};

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME || "holora_medical",
    });

    console.log("Starting Specialty Hierarchy Migration...\n");

    const ddlStatements = [
      addParentColumnSql,
      addParentIndexSql,
      addParentFkSql,
    ];

    for (let i = 0; i < ddlStatements.length; i += 1) {
      try {
        await connection.query(ddlStatements[i]);
        console.log(`Schema step ${i + 1}/${ddlStatements.length} executed`);
      } catch (err) {
        if (isIgnorableError(err)) {
          console.log(`Schema step ${i + 1}/${ddlStatements.length} skipped: ${err.message}`);
        } else {
          throw err;
        }
      }
    }

    for (let i = 0; i < hierarchySeed.length; i += 1) {
      const block = hierarchySeed[i];
      const parentId = await ensureSpecialty(connection, {
        ...block.parent,
        parentId: null,
      });

      for (let j = 0; j < block.children.length; j += 1) {
        const child = block.children[j];
        await ensureSpecialty(connection, {
          code: child.code,
          name: child.name,
          description: null,
          status: "active",
          parentId,
        });
      }
    }

    console.log("\nSpecialty hierarchy migration completed successfully!");
  } catch (error) {
    console.error("Specialty hierarchy migration failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
