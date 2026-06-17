// ════════════════════════════════════════════════════════════════
//  App.jsx — IHM corrigée
//  Corrections :
//    1. Redirection selon rôle après login (Admin → /, Secrétaire → /)
//    2. Spinner de chargement centré avec message
//    3. Route 404 propre
//    4. Route /mon-profil réservée au rôle etudiant
//    5. Ajout des flags React Router future pour v7 (suppression warnings)
// ════════════════════════════════════════════════════════════════
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EtudiantsPage from "./pages/EtudiantsPage";
import EtudiantDetailPage from "./pages/EtudiantDetailPage";
import MonProfilPage from "./pages/MonProfilPage";
import InscriptionsPage from "./pages/InscriptionsPage";
import NotesPage from "./pages/NotesPage";
import NotesSaisiePage from "./pages/NotesSaisiePage";
import FilieresPage from "./pages/FilieresPage";
import UtilisateursPage from "./pages/UtilisateursPage";
import PresencePage from "./pages/PresencePage";
import TransfertPage from "./pages/TransfertPage";
import MatieresPage from "./pages/MatieresPage";
import StudentLoginPage from "./pages/StudentLoginPage";
import StudentDashboardPage from "./pages/StudentDashboardPage";

/* ─── Écran de chargement ───────────────────────────────────── */
function LoadingScreen() {
  return (
    <div
      role="status"
      aria-label="Chargement en cours"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: 16,
        background: "var(--bg)",
      }}
    >
      <span className="spinner" style={{ width: 28, height: 28 }} />
      <span
        style={{
          fontSize: 14,
          color: "var(--text-muted)",
          fontFamily: "var(--font-body)",
        }}
      >
        Chargement…
      </span>
    </div>
  );
}

/* ─── Route protégée ─────────────────────────────────────────── */
function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

/* ─── Page 404 ───────────────────────────────────────────────── */
function NotFoundPage() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: "var(--border)",
          fontFamily: "var(--font-display)",
        }}
      >
        404
      </div>
      <h1 style={{ fontSize: 24, color: "var(--text)", marginTop: 16 }}>
        Page introuvable
      </h1>
      <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
        La page que vous cherchez n'existe pas.
      </p>
      <a
        href="/"
        style={{
          display: "inline-block",
          marginTop: 24,
          padding: "10px 24px",
          background: "var(--accent)",
          color: "#fff",
          borderRadius: "var(--radius-sm)",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Retour à l'accueil
      </a>
    </div>
  );
}

/* ─── Routes de l'application ───────────────────────────────── */
function AppRoutes() {
  const { user } = useAuth();

  // Redirection post-login selon le rôle
  const defaultHome = user?.role === "etudiant" ? "/mon-profil" : "/";

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={user ? <Navigate to={defaultHome} replace /> : <LoginPage />}
      />

      {/* Portail étudiant */}
      <Route path="etudiant/login" element={<StudentLoginPage />} />
      <Route path="etudiant/dashboard" element={<StudentDashboardPage />} />
      <Route path="etudiant/profil" element={<MonProfilPage />} />

      {/* Application principale */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        {/* Tableau de bord — Admin + Secrétaire + Enseignant */}
        <Route
          index
          element={
            user?.role === "etudiant" ? (
              <Navigate to="/mon-profil" replace />
            ) : (
              <DashboardPage />
            )
          }
        />

        {/* ── Interface Étudiant (Mon Profil) ── */}
        <Route
          path="mon-profil"
          element={
            <PrivateRoute roles={["etudiant"]}>
              <MonProfilPage />
            </PrivateRoute>
          }
        />

        {/* Gestion académique — Admin + Secrétaire */}
        <Route
          path="etudiants"
          element={
            <PrivateRoute roles={["administrateur", "secretaire"]}>
              <EtudiantsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="etudiants/:id"
          element={
            <PrivateRoute roles={["administrateur", "secretaire"]}>
              <EtudiantDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="inscriptions"
          element={
            <PrivateRoute roles={["administrateur", "secretaire"]}>
              <InscriptionsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="filieres"
          element={
            <PrivateRoute roles={["administrateur", "secretaire"]}>
              <FilieresPage />
            </PrivateRoute>
          }
        />
        <Route
          path="transferts"
          element={
            <PrivateRoute roles={["administrateur", "secretaire"]}>
              <TransfertPage />
            </PrivateRoute>
          }
        />
        <Route
          path="matieres"
          element={
            <PrivateRoute roles={["administrateur", "secretaire"]}>
              <MatieresPage />
            </PrivateRoute>
          }
        />

        {/* Pédagogie — Admin + Secrétaire + Enseignant */}
        <Route
          path="notes/saisie"
          element={
            <PrivateRoute
              roles={["administrateur", "secretaire", "enseignant"]}
            >
              <NotesSaisiePage />
            </PrivateRoute>
          }
        />
        <Route path="notes" element={<NotesPage />} />
        <Route
          path="presence"
          element={
            <PrivateRoute
              roles={["administrateur", "secretaire", "enseignant"]}
            >
              <PresencePage />
            </PrivateRoute>
          }
        />

        {/* Administration — Administrateur seulement */}
        <Route
          path="utilisateurs"
          element={
            <PrivateRoute roles={["administrateur"]}>
              <UtilisateursPage />
            </PrivateRoute>
          }
        />

        {/* 404 interne */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Fallback global */}
      <Route path="*" element={<Navigate to={defaultHome} replace />} />
    </Routes>
  );
}

/* ─── Racine ─────────────────────────────────────────────────── */
export default function App() {
  return (
    // ✅ Ajout des flags future pour React Router v7 (supprime les warnings)
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}