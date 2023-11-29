import React, { useState, useEffect, useRef } from "react";
import defaultPersonImage from "../assets/person.jpg";
import DashboardNav from "./DashboardNav";
import {
  fetchProfilePhoto,
  uploadProfilePhoto,
  decodeToken,
  validateFileType,
  handleSessionExpired,
  handleImageClick,
} from "./Funcs/ProfileFunctions";

const Profile = () => {
  // State variables
  const [selectedFile, setSelectedFile] = useState(null);
  const [user, setUser] = useState({});
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const fileInputRef = useRef(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setShowPopup(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("User not authenticated");
      }
      await uploadProfilePhoto(token, selectedFile);
      alert("Profile image updated successfully!");
      // Additional logic to update UI
      setIsLoading(false);
    } catch (error) {
      console.error("Error updating profile photo:", error);
      setIsLoading(false);
      alert("Failed to update profile image");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (validateFileType(file)) {
        setSelectedFile(file);
        setShowPopup(true);
      } else {
        alert("Please select a GIF or image file.");
      }
    }
  };

  // Fetch user data and profile photo on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = decodeToken(token);
      setUser(decodedToken);
      fetchProfilePhoto(token)
        .then((photoPath) => {
          if (photoPath) {
            setProfilePhoto(photoPath);
          }
        })
        .catch((error) => {
          console.error("Error fetching profile photo:", error);
          alert("Failed to fetch profile photo");
        });
    } else {
      handleSessionExpired();
    }
  }, []);

  const handleEmailChange = async () => {
    try {
      const token = localStorage.getItem("token");
      const userID = user.id; // Assuming you have the user's ID available in `user` state
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/update-email/${userID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newEmail: email }), // Assuming the new email is stored in the `email` state variable
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(data.message); // Show success message
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error); // Throw an error with the error message received from the API
      }
    } catch (error) {
      console.error("Error updating email:", error);
      alert("Failed to change email");
    }
  };

  return (
    <>
      <DashboardNav />
      <div className="max-w-md mx-auto p-3 mt-10 bg-primary shadow rounded">
        <div className="text-center mb-6">
          <div className="flex flex-col items-center">
            <img
              src={
                selectedFile
                  ? URL.createObjectURL(selectedFile)
                  : profilePhoto || defaultPersonImage
              }
              alt="Profile"
              className="rounded-full w-32 h-32 mx-auto border-2 border-error"
            />
            <span
              className="bg-gray-400 rounded-full p-2 w-10 mt-[-20px]"
              onClick={() => handleImageClick(fileInputRef)}
            >
              <i className="fa-solid fa-camera cursor-pointer text-white "></i>
            </span>
          </div>
          <h1 className="text-white text-2xl font-semibold mt-4">
            {user.username}
          </h1>
          <h2 className="text-white text-2xl font-semibold mt-4">
            {user.email}
          </h2>

          <input
            type="email"
            placeholder="Change Email"
            className="input input-bordered input-primary w-full max-w-xs"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={handleEmailChange}
            className="btn btn-sm btn-warning mt-2"
            disabled={isLoading}
          >
            {isLoading ? "Updating Email..." : "Save Changes"}
          </button>
        </div>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/gif, image/jpeg, image/png"
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
