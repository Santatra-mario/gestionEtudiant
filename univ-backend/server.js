// server.js – Point d'entrée principal de l'API UniGest
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");

const app = express();

// ── Dossier uploads ───────────────────────────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || "uploads/photos";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Middlewares globaux ───────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les photos uploadées
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Rate limiting : protection contre le brute-force sur le login ─────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // fenêtre de 15 minutes
  max: 20, // max 20 tentatives par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
  },
});

// ── Routes ───────────────────────────────────────────────────────────────────────────
app.use("/api/auth", loginLimiter, require("./routes/auth"));
app.use("/api/etudiants", require("./routes/etudiants"));
app.use("/api/inscriptions", require("./routes/inscriptions"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/filieres", require("./routes/filieres"));
app.use("/api/matieres", require("./routes/matieres"));
app.use("/api/presences", require("./routes/presences"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/users", require("./routes/users"));
app.use("/api/transferts", require("./routes/transferts"));

// ── Route de santé ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "UniGest API opérationnelle",
    version: "1.0.0",
  });
});

// ── Gestion 404 ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} introuvable.`,
  });
});

// ── Gestion erreurs globales ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Erreur non gérée :", err.stack);
  res
    .status(500)
    .json({ success: false, message: "Erreur interne du serveur." });
});

// ── Démarrage ───────────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`\n🎓 UniGest API démarrée sur http://localhost:${PORT}`);
  console.log(`   Environnement : ${process.env.NODE_ENV || "development"}`);
  console.log(`   Health check  : http://localhost:${PORT}/api/health\n`);
});

// Gestion propre de l'erreur EADDRINUSE (port déjà utilisé)
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\n❌ Erreur : le port ${PORT} est déjà utilisé par un autre processus.`,
    );
    console.error(`   → Sur Windows : ouvrez un terminal CMD et tapez :\n`);
    console.error(
      `       FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :${PORT}') DO taskkill /F /PID %P\n`,
    );
    console.error(`   → Sur PowerShell :\n`);
    console.error(
      `       Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`,
    );
    process.exit(1);
  } else {
    console.error("Erreur serveur inattendue :", err);
    process.exit(1);
  }
});
