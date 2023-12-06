import { Navigate, useLocation } from "react-router-dom";

const GuestRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return children;
  } else {
    return <Navigate to="/dashboard" />;
  }
};

export default GuestRoute;
