// backend/src/services/recurringAppointment.service.js

// Imports removed to match raw SQL architecture (mysql2)


const db = require('../config/db');

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function addWeeks(date, weeks) {
  return addDays(date, weeks * 7);
}
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function generateAppointments(recurring) {
  const { repeat_type, repeat_interval, repeat_days, start_date, end_date, patient_id, doctor_id, branch_id, id } = recurring;
  let current = new Date(start_date);
  const end = end_date ? new Date(end_date) : addMonths(current, 6); // default 6 months
  let created = [];
  let count = 0;
  let repeatDaysArr = [];
  try {
    if (typeof repeat_days === 'string') repeatDaysArr = JSON.parse(repeat_days);
    else if (Array.isArray(repeat_days)) repeatDaysArr = repeat_days;
  } catch { repeatDaysArr = []; }

  while (current <= end && count < 100) { // limit 100 occurrences
    // WEEKLY: chỉ tạo nếu đúng thứ
    if (repeat_type === 'weekly' && repeatDaysArr.length > 0) {
      if (!repeatDaysArr.includes(current.getDay())) {
        current = addDays(current, 1);
        continue;
      }
    }
    // Kiểm tra trùng lịch
    const [conflict] = await new Promise((resolve) => {
      db.query(
        `SELECT id FROM appointment WHERE doctor_id = ? AND appointment_date = ? AND status NOT IN ('cancelled', 'completed', 'no_show') LIMIT 1`,
        [doctor_id, current.toISOString().slice(0, 10)],
        (err, rows) => resolve(rows || [])
      );
    });
    if (!conflict) {
      await new Promise((resolve, reject) => {
        db.query(
          `INSERT INTO appointment (patient_id, doctor_id, branch_id, appointment_date, recurring_id, status) VALUES (?, ?, ?, ?, ?, 'scheduled')`,
          [patient_id, doctor_id, branch_id, current.toISOString().slice(0, 10), id],
          (err, result) => {
            if (!err) created.push(result.insertId);
            resolve();
          }
        );
      });
    }
    count++;
    if (repeat_type === 'daily') current = addDays(current, repeat_interval || 1);
    else if (repeat_type === 'weekly') current = addWeeks(current, repeat_interval || 1);
    else if (repeat_type === 'monthly') current = addMonths(current, repeat_interval || 1);
    else break;
  }
  return created;
}

module.exports = {
  generateAppointments,
};
