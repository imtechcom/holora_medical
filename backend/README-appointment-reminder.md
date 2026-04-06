# Automated Appointment Reminder Job

This backend job sends email reminders to patients before their scheduled appointments.

## How it works
- Checks for appointments scheduled in the next 2 to 24 hours (status = confirmed)
- Sends reminder emails to patients (and optionally doctors)
- Uses SMTP config from `.env`

## Usage

1. **Configure SMTP**
   - Copy `.env.example` to `.env` and fill in your SMTP credentials.

2. **Run the job manually**
   ```bash
   node src/jobs/appointmentReminder.job.js
   ```
   (Add to crontab or Windows Task Scheduler for automation)

3. **Sample .env config**
   ```env
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your@email.com
   SMTP_PASS=yourpassword
   SMTP_FROM=no-reply@holora.vn
   ```

## Customization
- Adjust reminder times in `REMINDER_HOURS` inside the job file.
- To enable doctor reminders, uncomment the relevant code.
