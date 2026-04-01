const db = require("../config/db");

const parseParentId = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return NaN;
  return parsed;
};

const buildSpecialtyTree = (rows) => {
  const byId = new Map();
  const roots = [];

  rows.forEach((row) => {
    byId.set(row.id, {
      ...row,
      children: [],
    });
  });

  rows.forEach((row) => {
    const current = byId.get(row.id);
    if (row.parent_id && byId.has(row.parent_id)) {
      byId.get(row.parent_id).children.push(current);
    } else {
      roots.push(current);
    }
  });

  return roots;
};

const fetchSpecialtyRows = (callback) => {
  const sql = `
    SELECT
      s.*,
      p.name AS parent_name,
      (
        SELECT COUNT(*)
        FROM specialty c
        WHERE c.parent_id = s.id
          AND c.deleted_at IS NULL
      ) AS child_count
    FROM specialty s
    LEFT JOIN specialty p ON p.id = s.parent_id
    WHERE s.deleted_at IS NULL
    ORDER BY
      CASE WHEN s.parent_id IS NULL THEN 0 ELSE 1 END,
      COALESCE(p.name, s.name) ASC,
      s.name ASC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      callback(err);
      return;
    }

    callback(null, rows);
  });
};

const fetchLeafSuggestions = (sourceId, sourceParentId, callback) => {
  const sql = `
    SELECT
      s.id,
      s.name,
      s.code,
      s.parent_id,
      p.name AS parent_name,
      (
        SELECT COUNT(*)
        FROM doctor d
        WHERE d.specialty_id = s.id
          AND d.status != 'deleted'
      ) AS doctor_count
    FROM specialty s
    LEFT JOIN specialty p ON p.id = s.parent_id
    WHERE s.deleted_at IS NULL
      AND s.id != ?
      AND (
        SELECT COUNT(*)
        FROM specialty c
        WHERE c.parent_id = s.id
          AND c.deleted_at IS NULL
      ) = 0
    ORDER BY
      CASE WHEN s.parent_id <=> ? THEN 0 ELSE 1 END,
      s.name ASC
  `;

  db.query(sql, [sourceId, sourceParentId], (err, rows) => {
    if (err) {
      callback(err);
      return;
    }

    callback(null, rows);
  });
};

const refreshDoctorCountBySpecialtyId = (specialtyId, callback) => {
  if (!specialtyId) {
    callback();
    return;
  }

  db.query(
    `
      UPDATE specialty s
      SET doctor_count = (
        SELECT COUNT(*)
        FROM doctor d
        WHERE d.specialty_id = s.id
          AND d.status != 'deleted'
      ),
      updated_at = NOW()
      WHERE s.id = ?
    `,
    [specialtyId],
    () => callback()
  );
};

const ensureParentExists = (parentId, currentId, callback) => {
  if (parentId === null) {
    callback(null);
    return;
  }

  if (Number.isNaN(parentId)) {
    callback({ statusCode: 400, message: "parent_id must be a positive integer or null" });
    return;
  }

  if (currentId && Number(currentId) === parentId) {
    callback({ statusCode: 400, message: "A specialty cannot be its own parent" });
    return;
  }

  const sql = `
    SELECT id, parent_id
    FROM specialty
    WHERE id = ?
      AND deleted_at IS NULL
    LIMIT 1
  `;

  db.query(sql, [parentId], (err, rows) => {
    if (err) {
      callback({ statusCode: 500, message: err.message });
      return;
    }

    if (!rows.length) {
      callback({ statusCode: 400, message: "Parent specialty not found or inactive" });
      return;
    }

    const walkToRoot = (nodeId, seen = new Set()) => {
      if (!nodeId) {
        callback(null);
        return;
      }

      const numericNodeId = Number(nodeId);
      if (seen.has(numericNodeId)) {
        callback({ statusCode: 400, message: "Invalid parent hierarchy detected" });
        return;
      }

      if (currentId && numericNodeId === Number(currentId)) {
        callback({ statusCode: 400, message: "Cannot create cyclic parent-child relationship" });
        return;
      }

      seen.add(numericNodeId);

      db.query(
        `
          SELECT parent_id
          FROM specialty
          WHERE id = ?
            AND deleted_at IS NULL
          LIMIT 1
        `,
        [numericNodeId],
        (walkErr, walkRows) => {
          if (walkErr) {
            callback({ statusCode: 500, message: walkErr.message });
            return;
          }

          if (!walkRows.length || !walkRows[0].parent_id) {
            callback(null);
            return;
          }

          walkToRoot(walkRows[0].parent_id, seen);
        }
      );
    };

    walkToRoot(parentId);
  });
};

// Get all specialties
const getAllSpecialties = (req, res) => {
  fetchSpecialtyRows((err, results) => {
    if (err) {
      console.error("Get all specialties error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    return res.json({
      message: "Specialties fetched successfully",
      data: results,
      tree: buildSpecialtyTree(results),
    });
  });
};

// Get specialty by ID
const getSpecialtyById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT s.*, p.name AS parent_name
    FROM specialty s
    LEFT JOIN specialty p ON p.id = s.parent_id
    WHERE s.id = ? AND s.deleted_at IS NULL
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Get specialty by ID error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Specialty not found",
      });
    }

    return res.json({
      message: "Specialty fetched successfully",
      data: results[0],
    });
  });
};

// Create specialty
const createSpecialty = (req, res) => {
  const { name, code, description, status, parent_id } = req.body;
  const parentId = parseParentId(parent_id);

  // Validate required fields
  if (!name || !code) {
    return res.status(400).json({
      message: "Specialty name and code are required",
    });
  }

  // Validate code format (uppercase letters, numbers, underscores only)
  if (!/^[A-Z0-9_]+$/.test(code)) {
    return res.status(400).json({
      message: "Code must contain only uppercase letters, numbers, and underscores",
    });
  }

  ensureParentExists(parentId, null, (parentErr) => {
    if (parentErr) {
      return res.status(parentErr.statusCode || 500).json({
        message: parentErr.message,
      });
    }

    // Check if code already exists
  const checkSql = "SELECT id FROM specialty WHERE code = ? AND deleted_at IS NULL";
  db.query(checkSql, [code], (err, results) => {
    if (err) {
      console.error("Check code error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length > 0) {
      return res.status(400).json({
        message: "Specialty code already exists",
      });
    }

    const insertSql = `
      INSERT INTO specialty (name, code, parent_id, description, status, doctor_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())
    `;

    const insertValues = [
      name,
      code,
      parentId,
      description || null,
      status || "active",
    ];

    db.query(insertSql, insertValues, (err, result) => {
      if (err) {
        console.error("Create specialty error:", err);
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      const newSpecialty = {
        id: result.insertId,
        name,
        code,
        parent_id: parentId,
        parent_name: null,
        description,
        status: status || "active",
        doctor_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      return res.status(201).json({
        message: "Specialty created successfully",
        data: newSpecialty,
      });
    });
  });
  });
};

// Update specialty
const updateSpecialty = (req, res) => {
  const { id } = req.params;
  const { name, code, description, status, parent_id } = req.body;
  const parentId = parseParentId(parent_id);

  if (!name) {
    return res.status(400).json({
      message: "Specialty name is required",
    });
  }

  ensureParentExists(parentId, id, (parentErr) => {
    if (parentErr) {
      return res.status(parentErr.statusCode || 500).json({
        message: parentErr.message,
      });
    }

  // Code cannot be changed on update
  const updateSql = `
    UPDATE specialty
    SET name = ?, parent_id = ?, description = ?, status = ?, updated_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
  `;

  db.query(updateSql, [name, parentId, description || null, status || "active", id], (err, result) => {
    if (err) {
      console.error("Update specialty error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Specialty not found",
      });
    }

    // Fetch updated specialty
    const selectSql = `
      SELECT s.*, p.name AS parent_name
      FROM specialty s
      LEFT JOIN specialty p ON p.id = s.parent_id
      WHERE s.id = ? AND s.deleted_at IS NULL
    `;
    db.query(selectSql, [id], (err, results) => {
      if (err) {
        console.error("Fetch updated specialty error:", err);
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      return res.json({
        message: "Specialty updated successfully",
        data: results[0],
      });
    });
  });
  });
};

// Delete specialty (soft delete)
const deleteSpecialty = (req, res) => {
  const { id } = req.params;

  // Check if specialty has doctors assigned
  const checkSql = `
    SELECT
      (
        SELECT COUNT(*) FROM doctor
        WHERE specialty_id = ? AND status != 'deleted'
      ) AS doctor_count,
      (
        SELECT COUNT(*) FROM specialty
        WHERE parent_id = ? AND deleted_at IS NULL
      ) AS child_count,
      (
        SELECT parent_id FROM specialty
        WHERE id = ? AND deleted_at IS NULL
        LIMIT 1
      ) AS parent_id
  `;

  db.query(checkSql, [id, id, id], (err, results) => {
    if (err) {
      console.error("Check doctors error:", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results[0].parent_id === null && Number(results[0].child_count) === 0 && Number(results[0].doctor_count) === 0) {
      return res.status(404).json({
        message: "Specialty not found",
      });
    }

    if (results[0].child_count > 0) {
      return res.status(400).json({
        message: "Cannot delete parent specialty with child specialties",
      });
    }

    if (results[0].doctor_count > 0) {
      return fetchLeafSuggestions(Number(id), results[0].parent_id || null, (suggestErr, suggestions) => {
        if (suggestErr) {
          console.error("Fetch leaf suggestions error:", suggestErr);
          return res.status(500).json({
            message: "Database error",
            error: suggestErr.message,
          });
        }

        return res.status(409).json({
          message: "Cannot delete specialty with assigned doctors",
          code: "SPECIALTY_HAS_DOCTORS",
          data: {
            specialty_id: Number(id),
            doctor_count: Number(results[0].doctor_count || 0),
            suggested_leaf_specialties: suggestions,
          },
        });
      });
    }

    // Soft delete the specialty
    const deleteSql = `
      UPDATE specialty
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;

    db.query(deleteSql, [id], (err, result) => {
      if (err) {
        console.error("Delete specialty error:", err);
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Specialty not found",
        });
      }

      return res.json({
        message: "Specialty deleted successfully",
      });
    });
  });
};

const updateSpecialtyParent = (req, res) => {
  const { id } = req.params;
  const { parent_id } = req.body;
  const parentId = parseParentId(parent_id);

  ensureParentExists(parentId, id, (parentErr) => {
    if (parentErr) {
      return res.status(parentErr.statusCode || 500).json({
        message: parentErr.message,
      });
    }

    db.query(
      `
        UPDATE specialty
        SET parent_id = ?, updated_at = NOW()
        WHERE id = ?
          AND deleted_at IS NULL
      `,
      [parentId, id],
      (err, result) => {
        if (err) {
          console.error("Update specialty parent error:", err);
          return res.status(500).json({
            message: "Database error",
            error: err.message,
          });
        }

        if (!result.affectedRows) {
          return res.status(404).json({ message: "Specialty not found" });
        }

        return res.json({
          message: "Specialty parent updated successfully",
        });
      }
    );
  });
};

const reassignAndDeleteSpecialty = (req, res) => {
  const { id } = req.params;
  const { target_specialty_id } = req.body;

  const sourceId = Number(id);
  const targetId = Number(target_specialty_id);

  if (!Number.isInteger(sourceId) || sourceId <= 0) {
    return res.status(400).json({ message: "Invalid source specialty id" });
  }

  if (!Number.isInteger(targetId) || targetId <= 0) {
    return res.status(400).json({ message: "target_specialty_id is required" });
  }

  if (sourceId === targetId) {
    return res.status(400).json({ message: "Source and target specialties must be different" });
  }

  const sourceCheckSql = `
    SELECT
      s.id,
      (
        SELECT COUNT(*)
        FROM specialty c
        WHERE c.parent_id = s.id
          AND c.deleted_at IS NULL
      ) AS child_count,
      (
        SELECT COUNT(*)
        FROM doctor d
        WHERE d.specialty_id = s.id
          AND d.status != 'deleted'
      ) AS doctor_count
    FROM specialty s
    WHERE s.id = ?
      AND s.deleted_at IS NULL
    LIMIT 1
  `;

  db.query(sourceCheckSql, [sourceId], (sourceErr, sourceRows) => {
    if (sourceErr) {
      return res.status(500).json({ message: "Database error", error: sourceErr.message });
    }

    if (!sourceRows.length) {
      return res.status(404).json({ message: "Source specialty not found" });
    }

    if (Number(sourceRows[0].child_count || 0) > 0) {
      return res.status(400).json({ message: "Cannot delete parent specialty with child specialties" });
    }

    const targetCheckSql = `
      SELECT
        s.id,
        (
          SELECT COUNT(*)
          FROM specialty c
          WHERE c.parent_id = s.id
            AND c.deleted_at IS NULL
        ) AS child_count
      FROM specialty s
      WHERE s.id = ?
        AND s.deleted_at IS NULL
      LIMIT 1
    `;

    db.query(targetCheckSql, [targetId], (targetErr, targetRows) => {
      if (targetErr) {
        return res.status(500).json({ message: "Database error", error: targetErr.message });
      }

      if (!targetRows.length) {
        return res.status(400).json({ message: "Target specialty not found or inactive" });
      }

      if (Number(targetRows[0].child_count || 0) > 0) {
        return res.status(400).json({ message: "Target specialty must be a leaf specialty" });
      }

      db.query(
        `
          UPDATE doctor
          SET specialty_id = ?, updated_at = NOW()
          WHERE specialty_id = ?
            AND status != 'deleted'
        `,
        [targetId, sourceId],
        (moveErr, moveResult) => {
          if (moveErr) {
            return res.status(500).json({ message: "Database error", error: moveErr.message });
          }

          db.query(
            `
              UPDATE specialty
              SET deleted_at = NOW(), updated_at = NOW()
              WHERE id = ?
                AND deleted_at IS NULL
            `,
            [sourceId],
            (deleteErr, deleteResult) => {
              if (deleteErr) {
                return res.status(500).json({ message: "Database error", error: deleteErr.message });
              }

              if (!deleteResult.affectedRows) {
                return res.status(404).json({ message: "Source specialty not found" });
              }

              refreshDoctorCountBySpecialtyId(sourceId, () => {
                refreshDoctorCountBySpecialtyId(targetId, () => {
                  return res.json({
                    message: "Doctors reassigned and specialty deleted successfully",
                    data: {
                      source_specialty_id: sourceId,
                      target_specialty_id: targetId,
                      moved_doctor_count: Number(moveResult.affectedRows || 0),
                    },
                  });
                });
              });
            }
          );
        }
      );
    });
  });
};

module.exports = {
  getAllSpecialties,
  getSpecialtyById,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
  updateSpecialtyParent,
  reassignAndDeleteSpecialty,
};
