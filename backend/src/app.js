const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

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
const { errorHandler } = require("./middleware/error.middleware");
const path = require("path");

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
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

// Phục vụ thư mục hình ảnh tĩnh (Upload)
app.use('/public', express.static(path.join(__dirname, '../public')));

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;