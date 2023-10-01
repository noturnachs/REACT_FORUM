import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import person from "../assets/person.jpg";

const DashboardBody = () => {
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
    <>
      <div className="max-w-md mx-auto p-2">
        <div className="card card-compact w-96 bg-base-100 shadow-xl">
          <figure>
            <img
              src="https://wallpapers.com/images/hd/animated-disney-castle-has6vy47k75d0bzs.jpg"
              alt="Disney"
            />
          </figure>
          <div className="card-body">
            <h2 className="card-title">
              Disney ends broadcasting TV channels, including National
              Geographic, in Southeast Asia
            </h2>
            <p>
              MANILA, Philippines – Beginning October 1, Filipinos can no longer
              watch their favorite Disney channels on TV, including the National
              Geographic channel, as the Walt Disney Company ceased the
              broadcast of their linear TV channels in Southeast Asia. <br></br>
              <br></br>
              <b>| via BONZ MAGSAMBOL, Rappler</b>
            </p>
            <div className="card-actions justify-end">
              <a
                href="https://www.rappler.com/business/filipinos-can-no-longer-watch-disney-channels-october-1-2023/#:~:text=The%20channels%20that%20stopped%20broadcasting,first%20announced%20in%20June%202023."
                target="_blank"
                class="btn btn-primary"
              >
                Read More
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default DashboardBody;
