import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const lastLink = new URLSearchParams(location.search).get("lastLink");

  if (token) {
    return children;
  } else {
    const loginUrl = `/api/login?lastLink=${encodeURIComponent(
      location.pathname
    )}`;
    return <Navigate to={loginUrl} />;
  }
};

export default ProtectedRoute;
