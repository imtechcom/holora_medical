// backend/src/jobs/appointmentReminder.job.js
// Cron job to send appointment reminder emails
const db = require('../config/db');
const { sendMail } = require('../utils/email.util');

// How many hours before appointment to send reminder
const REMINDER_HOURS = [24, 2]; // 24h and 2h before

async function getUpcomingAppointments() {
  // Get appointments in the next 2-24 hours that haven't been reminded
  const now = new Date();
  const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2h
  const maxTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
  const [rows] = await db.promise().query(
    `SELECT a.id, a.scheduled_at, a.status, p.email AS patient_email, p.full_name AS patient_name, d.full_name AS doctor_name, d.email AS doctor_email
     FROM appointment a
     JOIN patient p ON a.patient_id = p.id
     JOIN doctor d ON a.doctor_id = d.id
     WHERE a.status = 'confirmed' AND a.scheduled_at BETWEEN ? AND ?`,
    [minTime, maxTime]
  );
  return rows;
}

async function sendAppointmentReminders() {
  const appointments = await getUpcomingAppointments();
  for (const appt of appointments) {
    // Send to patient
    if (appt.patient_email) {
      await sendMail({
        to: appt.patient_email,
        subject: `Nhắc lịch hẹn khám bệnh` ,
        text: `Xin chào ${appt.patient_name},\nBạn có lịch hẹn với bác sĩ ${appt.doctor_name} vào lúc ${appt.scheduled_at}. Vui lòng đến đúng giờ.`,
      });
    }
    // Send to doctor (optional)
    // if (appt.doctor_email) {
    //   await sendMail({
    //     to: appt.doctor_email,
    //     subject: `Lịch hẹn với bệnh nhân ${appt.patient_name}` ,
    //     text: `Bạn có lịch hẹn với bệnh nhân ${appt.patient_name} vào lúc ${appt.scheduled_at}.`,
    //   });
    // }
  }
}

// Run as script
if (require.main === module) {
  sendAppointmentReminders().then(() => {
    console.log('Appointment reminders sent.');
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { sendAppointmentReminders };