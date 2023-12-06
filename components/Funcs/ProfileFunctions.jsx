import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";

export const fetchProfilePhoto = (token) => {
  return fetch(`${import.meta.env.VITE_API_URL}/api/users/profilePhoto`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network error occurred.");
      }
      return response.json();
    })
    .then((data) => {
      if (data && data.profilePhotoPath) {
        return `${import.meta.env.VITE_API_URL}${data.profilePhotoPath}`;
      }
    })
    .catch((error) => {
      console.error("Error fetching profile photo:", error);
      return null;
    });
};

export const uploadProfilePhoto = async (token, selectedFile) => {
  if (!selectedFile) {
    throw new Error("Please select a file to upload.");
  }
  const formData = new FormData();
  formData.append("profile_photo", selectedFile);
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/users/uploadProfilePhoto`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );
    if (response.ok) {
      return true;
    } else {
      throw new Error("Failed to upload image.");
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Error uploading image.");
  }
};

export const decodeToken = (token) => {
  try {
    return jwt_decode(token);
  } catch (error) {
    console.error("Error decoding token:", error);
    throw new Error("Error decoding token.");
  }
};

export const validateFileType = (file) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  return allowedTypes.includes(file.type);
};

// Handle session expiration
export const handleSessionExpired = () => {
  const navigate = useNavigate();
  alert("Session expired. Please log in again.");
  localStorage.removeItem("token");
  navigate("/api/login");
  // Additional logic to handle session expiration
};

// Handle image click
export const handleImageClick = (fileInputRef) => {
  fileInputRef.current.click(); // Trigger file input on button/icon click
};
