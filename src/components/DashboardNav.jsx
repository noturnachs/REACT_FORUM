import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import person from "../assets/person.jpg";

const handleLogout = () => {
  localStorage.removeItem("token");
  navigate("/api/login");
};

const DashboardNav = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});

  useEffect(() => {
    // Get the JWT token from localStorage
    const token = localStorage.getItem("token");

    if (token) {
      // Decode the JWT token to access user information
      const decodedToken = jwt_decode(token);
      setUser(decodedToken); // Set the user information in the state
    } else {
      // Handle the case where the token is not present (user not authenticated)
      navigate("/api/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/api/login");
  };
  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <a className="btn btn-ghost normal-case text-xl">USC Forum</a>
      </div>
      <div className="flex-none gap-2">
        <div className="form-control">
          <input
            type="text"
            placeholder="Search"
            className="input input-bordered w-24 md:w-auto"
          />
        </div>
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <img src={person} />
            </div>
          </label>
          <ul
            tabIndex={0}
            className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
          >
            <li>
              <a className="justify-between">
                {user.username}
                <span className="badge">New</span>
              </a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <a onClick={handleLogout} className="">
                Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
export default DashboardNav;
