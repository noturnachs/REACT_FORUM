import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import jwt_decode from "jwt-decode";
import person from "../assets/person.jpg";


const DashboardNav = () => {
  const location = useLocation();
  const isStorePage = location.pathname === "/store";
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

  const toStore = () => {
    navigate("/store")
  }

  const goDash = () => {
    navigate("/dashboard")
  }



  return (
    <div className="navbar bg-base-100">
      <a className="btn btn-ghost normal-case text-xl" onClick={isStorePage ? goDash : null }>Hatdog</a>
      <div className="flex-1">
        <div className="dropdown dropdown-hover">
          <label tabIndex={0} className="btn m-1">
            Categories
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-[#E1E8ED] rounded-box w-52"
          >
            <li className="sas p-1 rounded-box">
              <a >School of Arts and Sciences</a>
            </li>
            <li className="soe p-1 rounded-box mt-2">
              <a>School of Engineering</a>
            </li>
          </ul>
        </div>
        &nbsp;&nbsp;&nbsp;
        <button type="button" className="btn" onClick={toStore}>
        <i className="fa-solid fa-store"></i>
        </button>
      </div>
      <div className="flex-none gap-2">
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <img src={person} alt="Profile" />{" "}
              {/* Display user's profile picture */}
            </div>
          </label>
          <ul
            tabIndex={0}
            className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-300 rounded-box w-52"
          >
            <li>
              <a className="justify-between">
                {user.username}
                <span className="badge badge-success">New</span>
              </a>
            </li>
            <li>
              <a href="#">Profile</a> {/* Link to the user's profile */}
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
