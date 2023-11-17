import React, { useState, useEffect, useRef } from "react";
import defaultPersonImage from "../assets/person.jpg";
import jwt_decode from "jwt-decode";

import DashboardNav from "./DashboardNav";

const Profile = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [user, setUser] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMuted, setIsMuted] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const fileInputRef = useRef(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      const decodedToken = jwt_decode(token);
      setUser(decodedToken);
      setIsAdmin(decodedToken.role === "admin");
      setIsMuted(decodedToken.status === "muted" ? "muted" : "none");
      // Fetch user profile photo
      fetch(`${import.meta.env.VITE_API_URL}/api/users/profilePhoto`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data && data.profilePhotoPath) {
            setProfilePhoto(
              `${import.meta.env.VITE_API_URL}${data.profilePhotoPath}`
            );
          }
        })
        .catch((error) =>
          console.error("Error fetching profile photo:", error)
        );

      // Fetch user profile photo
    }
  }, []);

  const handleFileChange = (event) => {
    if (event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setShowPopup(true); // Show the popup when a file is selected
    }
  };

  const handleImageClick = () => {
    fileInputRef.current.click(); // Trigger file input on button/icon click
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setShowPopup(false);
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("profile_photo", selectedFile);

    // Send formData to your backend
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/uploadProfilePhoto`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        alert("Profile image updated successfully!");
        // Additional logic to update UI
      } else {
        alert("Failed to upload image.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error uploading image.");
    }
  };

  return (
    <>
      <DashboardNav />
      <div className="max-w-md mx-auto p-3 mt-10 bg-[#83c8e4] shadow rounded">
        <div className="text-center mb-6">
          <div className="flex flex-col items-center">
            <img
              src={
                selectedFile
                  ? URL.createObjectURL(selectedFile)
                  : profilePhoto || defaultPersonImage
              }
              alt="Profile"
              className="rounded-full w-32 h-32 mx-auto border-2 border-primary"
            />
            <span
              className="bg-gray-400 rounded-full p-2 w-10 mt-[-20px]"
              onClick={handleImageClick}
            >
              <i className="fa-solid fa-camera cursor-pointer text-white "></i>
            </span>
          </div>
          <h1 className="text-white text-2xl font-semibold mt-4">
            {user.username}
          </h1>
          <p className="text-white font-bold">{user.email}</p>
        </div>

        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {showPopup && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Confirm Profile Picture</h3>
              <p className="py-4">
                Are you sure you want to update your profile picture?
              </p>
              <div className="modal-action">
                <button onClick={handleSubmit} className="btn btn-primary">
                  Yes, Update
                </button>
                <button
                  onClick={() => setShowPopup(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;
