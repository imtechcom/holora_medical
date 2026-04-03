const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

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

app.get("/", (req, res) => {
  res.json({ message: "Holora Medical Backend is running" });
});

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

// Phục vụ thư mục hình ảnh tĩnh (Upload)
app.use('/public', express.static(path.join(__dirname, '../public')));

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;