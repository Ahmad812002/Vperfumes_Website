import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/components/Login";
import AdminDashboard from "@/components/AdminDashboard";
import CompanyDashboard from "@/components/CompanyDashboard";
import Settings from "@/components/Settings";
import CompanyManagement from "@/components/CompanyManagement";
import { useAuth } from "./AuthContext";

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showCompanyManagement, setShowCompanyManagement] = useState(false);
  const { user, loading } = useAuth();

  console.log("App, user:", user)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-900"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              !user ? (
                <Login />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/"
            element={
              user ? (
                showSettings ? (
                  <Settings onBack={() => setShowSettings(false)} />
                ) : showCompanyManagement ? (
                  <CompanyManagement onBack={() => setShowCompanyManagement(false)} />
                ) : user.role === "admin" ? (
                  <AdminDashboard 
                    // user={user} 
                    // onLogout={handleLogout} 
                    onSettings={() => setShowSettings(true)}
                    onManageCompanies={() => setShowCompanyManagement(true)}
                  />
                ) : (
                  <CompanyDashboard 
                  // user={user} onLogout={handleLogout} 
                  onSettings={() => setShowSettings(true)} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
