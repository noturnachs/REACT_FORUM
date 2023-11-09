import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import jwt_decode from "jwt-decode";
import person from "../assets/person.jpg";

const DashboardNav = ({ setSelectedCategory }) => {
  const location = useLocation();
  const isStorePage = location.pathname === "/store";
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [selectedCategoryName, setSelectedCategoryName] =
    useState("Categories");

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
    navigate("/store");
  };

  const goDash = () => {
    navigate("/dashboard");
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
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
            <li
              className="sas p-1 rounded-box"
              onClick={() => handleCategoryClick("All Categories")}
            >
              <a>All Categories</a>
            </li>

            <li
              className="sas p-1 rounded-box"
              onClick={() => handleCategoryClick("School of Arts and Sciences")}
            >
              <a>School of Arts and Sciences</a>
            </li>
            <li
              className="soe p-1 rounded-box "
              onClick={() => handleCategoryClick("School of Engineering")}
            >
              <a>School of Engineering</a>
            </li>

            <li
              className="safad p-1 rounded-box"
              onClick={() =>
                handleCategoryClick(
                  "School of Architecture, Fine Arts and Design"
                )
              }
            >
              <a>School of Architecture, Fine Arts and Design</a>
            </li>

            <li
              className="sbe p-1 rounded-box"
              onClick={() =>
                handleCategoryClick("School of Business and Economics")
              }
            >
              <a>School of Business and Economics</a>
            </li>

            <li
              className="soed p-1 rounded-box"
              onClick={() => handleCategoryClick("School of Education")}
            >
              <a>School of Education</a>
            </li>
            <li
              className="shp p-1 rounded-box"
              onClick={() =>
                handleCategoryClick("School of Healthcare Professions")
              }
            >
              <a>School of Healthcare Professions</a>
            </li>
            <li
              className="slg p-1 rounded-box"
              onClick={() =>
                handleCategoryClick("School of Law and Governance")
              }
            >
              <a>School of Law and Governance</a>
            </li>

            <li
              className="trst p-1 rounded-box"
              onClick={() => handleCategoryClick("Trashtalks")}
            >
              <a>Trashtalks</a>
            </li>
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
