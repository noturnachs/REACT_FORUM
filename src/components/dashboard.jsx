import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import DashboardNav from "./DashboardNav";
import DashboardBody from "./DashboardBody";

const Dashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  return (
    <div>
      <DashboardNav setSelectedCategory={setSelectedCategory} />
      <DashboardBody selectedCategory={selectedCategory} />
    </div>
  );
};

export default Dashboard;
