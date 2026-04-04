const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const rateLimit = require("express-rate-limit");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

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
const { errorHandler } = require("./middleware/error.middleware");

const app = express();

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

app.get("/", (req, res) => {
  res.json({ message: "Holora Medical Backend is running" });
});

app.use("/auth/login", authLimiter);
app.use("/auth/register", authLimiter);
app.use("/auth/google", authLimiter);
app.use("/auth/forgot-password", strictAuthLimiter);
app.use("/auth/reset-password", strictAuthLimiter);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/roles", roleRoutes);
app.use("/permissions", permissionRoutes);
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

// Phục vụ thư mục hình ảnh tĩnh (Upload)
app.use('/public', express.static(path.join(__dirname, '../public')));

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;