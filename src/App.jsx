import LoginForm from "./components/Login";
import RegistrationForm from "./components/RegistrationForm";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import Dashboard from "./components/dashboard";
import React, { useEffect } from "react";
import "./index.css";

const RedirectToLogin = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/api/login");
  }, []);
  return null;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RedirectToLogin />} />
        <Route
          path="/api/login"
          element={
            <GuestRoute>
              <LoginForm />
            </GuestRoute>
          }
        />
        <Route
          path="/api/register"
          element={
            <GuestRoute>
              <RegistrationForm />
            </GuestRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
