import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import jwt_decode from "jwt-decode";
import person from "../assets/person.jpg";
import { isTokenExpired } from "../utils/authUtils";

const DashboardNav = ({ setSelectedCategory }) => {
  const location = useLocation();
  const isStorePage = location.pathname === "/store";
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [selectedCategoryName, setSelectedCategoryName] =
    useState("Categories");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Get the JWT token from localStorage
    const token = localStorage.getItem("token");

    // Fetch categories from the backend
    fetch(`${import.meta.env.VITE_API_URL}/api/categories`)
      .then((response) => response.json())
      .then((data) => {
        setCategories([{ name: "All Categories", id: "all" }, ...data]);
      })
      .catch((error) => console.error("Error fetching categories:", error));

    if (token) {
      // Decode the JWT token to access user information
      const decodedToken = jwt_decode(token);
      setUser(decodedToken); // Set the user information in the state
    } else {
      // Handle the case where the token is not present (user not authenticated)
      localStorage.removeItem("token");
      navigate("/api/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
    navigate("/api/login");
  };

  const toStore = () => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("token");

      alert("Your session has expired. Please login again.");
      navigate("/api/login");
      return;
    }
    navigate("/store");
  };

  const goDash = () => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("token");

      alert("Your session has expired. Please login again.");
      navigate("/api/login");
      return;
    }
    navigate("/dashboard");
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category === "All Categories" ? "" : category);
    setSelectedCategoryName(category);
  };

  return (
    <div className="navbar bg-base-100">
      <a
        className="btn btn-ghost normal-case text-xl uscbrand font-bold"
        onClick={isStorePage ? goDash : null}
      >
        TCC
      </a>
      <div className="flex-1">
        <div
          className={`dropdown dropdown-hover ddnav ${
            isStorePage ? "hidden" : ""
          }`}
        >
          <label
            tabIndex={0}
            className="btn m-1 bg-[#13ac4c] text-white tracking-wider"
          >
            {selectedCategoryName}
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-[#E1E8ED] rounded-box w-52"
          >
            {categories.map((category) => (
              <li
                key={category.id}
                className="sas p-1 rounded-box"
                onClick={() => handleCategoryClick(category.name)}
              >
                <a>{category.name}</a>
              </li>
            ))}
          </ul>
        </div>
        &nbsp;&nbsp;&nbsp;
        <button type="button" className="btn bg-[#FBBF16]" onClick={toStore}>
          <i className="fa-solid fa-store text-white"></i>
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
