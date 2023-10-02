import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import DashboardNav from "./DashboardNav";
import DashboardBody from "./DashboardBody";

const Dashboard = () => {
  return (
    <div>
      <DashboardNav />
      <DashboardBody />
    </div>
  );
};

export default Dashboard;
