const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const rateLimit = require("express-rate-limit");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters");
}

// Load routes only after environment variables are available.
const recurringAppointmentChildRoutes = require("./routes/recurringAppointment.child.routes");
const recurringAppointmentRoutes = require("./routes/recurringAppointment.routes");
// earningsHistoryRoutes require và app.use sẽ được đặt sau khi khai báo app

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const roleRoutes = require("./routes/role.routes");
const permissionRoutes = require("./routes/permission.routes");
const patientRoutes = require("./routes/patient.routes");
const doctorRoutes = require("./routes/doctor.routes");
const specialtyRoutes = require("./routes/specialty.routes");
const branchRoutes = require("./routes/branch.routes");
const consultationRoutes = require("./routes/consultation.routes");
const uploadRoutes = require("./routes/upload.routes");
const aiRoutes = require("./routes/ai.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const holoraMindRoutes = require("./routes/holoraMind.routes");
const auditRoutes = require("./routes/audit.routes");
const reviewRoutes = require("./routes/review.routes");
const prescriptionRoutes = require("./routes/prescription.routes");
const earningsRoutes = require("./routes/earnings.routes");
const emrRoutes = require("./routes/emr.routes");
const paymentRoutes = require("./routes/payment.routes");
const notificationRoutes = require("./routes/notification.routes");

const { errorHandler } = require("./middleware/error.middleware");
const { authenticateToken } = require("./middleware/auth.middleware");
const { authorizeRole } = require("./middleware/role.middleware");
const adminOnly = authorizeRole("admin", "super_admin");


const app = express();
// Mount earningsHistoryRoutes sau khi app đã được khai báo
const earningsHistoryRoutes = require("./routes/earnings-history.routes");

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Cho phép requests không có origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// ── Rate Limiters ──────────────────────────────────────────────────────────────
// Global: 100 req / minute / IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Auth endpoints: 10 req / minute / IP (login, register, Google OAuth)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts, please try again later." },
});

// Strict: forgot-password, reset-password — 3 req / 15 min / IP
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please wait 15 minutes." },
});

app.use(globalLimiter);

app.use("/api/earnings", earningsHistoryRoutes);
app.use("/api/emr", emrRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/recurring-appointments", authenticateToken, adminOnly, recurringAppointmentChildRoutes);
app.use("/api/recurring-appointments", authenticateToken, adminOnly, recurringAppointmentRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Holora Medical Backend is running" });
});

app.use("/auth/login", authLimiter);
app.use("/auth/register", authLimiter);
app.use("/auth/google", authLimiter);
app.use("/auth/forgot-password", strictAuthLimiter);
app.use("/auth/reset-password", strictAuthLimiter);
app.use("/auth", authRoutes);
app.use("/users", authenticateToken, adminOnly, userRoutes);
app.use("/roles", authenticateToken, adminOnly, roleRoutes);
app.use("/permissions", authenticateToken, adminOnly, permissionRoutes);
app.use("/patients", patientRoutes);
app.use("/doctors", doctorRoutes);
app.use("/specialties", specialtyRoutes);
app.use("/branches", branchRoutes);
app.use("/consultations", consultationRoutes);
app.use("/upload", uploadRoutes);
app.use("/ai", aiRoutes);
app.use("/schedules", scheduleRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/holoramind", holoraMindRoutes);
app.use("/audit-logs", auditRoutes);
app.use("/reviews", reviewRoutes);
app.use("/prescriptions", prescriptionRoutes);
app.use("/earnings", earningsRoutes);
app.use("/notifications", notificationRoutes);


// Phục vụ thư mục hình ảnh tĩnh (Upload)
app.use('/public', express.static(path.join(__dirname, '../public')));

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
