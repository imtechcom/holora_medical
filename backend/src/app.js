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

const app = express();

app.use(cors());
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

module.exports = app;