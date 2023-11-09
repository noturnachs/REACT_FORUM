import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import DashboardNav from "./DashboardNav";
import DashboardBody from "./DashboardBody";

const Dashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const navigate = useNavigate();

  // useEffect(() => {
  //   const token = localStorage.getItem("token");
  //   if (!token || isTokenExpired(token)) {
  //     localStorage.removeItem("token");
  //     alert("Your session has expired. Please login again.");
  //     navigate("/api/login");
  //   }
  // }, []);
  return (
    <div>
      <DashboardNav setSelectedCategory={setSelectedCategory} />
      <DashboardBody selectedCategory={selectedCategory} />
    </div>
  );
};

export default Dashboard;
