import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import HeaderIMG from "../assets/usc75_01ed.png"


const RegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [successMessage, setSuccessMessage] = useState(""); // New state for success message

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password } = formData;
    const newErrors = {};
  
    // Check if username is empty
    if (!username) {
      newErrors.username = "Username is required";
    }
  
    if (!email) {
      newErrors.email = "Email is required";
    }
  
    // Check if password is empty
    if (!password) {
      newErrors.password = "Password is required";
    }
  
    // If there are errors, update the state and prevent submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      const response = await axios.post(
        "https://backendforum.ngrok.app/api/register",
        formData
      );
      if (response.status === 201) {
        // Registration successful, clear form and show success message
        setFormData({ username: "", password: "", email: "" });
        setSuccessMessage("Registered Successfully! \nYou can now Login.");
      } else {
        // Registration failed, handle the error message
        if (response.data && response.data.error) {
          setError(response.data.error); // Display the error message from the server
        } else {
          setError("Registration failed. Please try again.");
        }
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
  };

  const handleLoginClick = () => {
    // Redirect to /api/register when the "Register" button is clicked
    navigate("/api/login");
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 shadow-md rounded-md">
      <div className="flex items-center justify-center h-screen">
  <div className="card card-compact w-96 bg-base-100 shadow-xl">
    <figure><img src={HeaderIMG} alt="USC_75" /></figure>
    <div className="card-body">
    {successMessage && ( // Render the success message conditionally
        <div className="p-2 text-green-600">{successMessage}</div>
      )}
      <form onSubmit={handleSubmit} className="text-center">
        <div className="mb-4">
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            className="input input-bordered input-accent w-full max-w-xs"
          />
          {errors.username && (
            <p className="text-red-500 text-xs mt-1">{errors.username}</p>
          )}
        </div>
        <div className="mb-4">
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="input input-bordered input-accent w-full max-w-xs"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>
        <div className="mb-4">
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="input input-bordered input-accent w-full max-w-xs"
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>
        <div className="flex flex-col">
          <button type="submit" className="btn btn-accent mb-5">
            Register
          </button>
          <button
            type="button"
            className="btn btn-accent"
            onClick={handleLoginClick}
          >
            Login
          </button>
        </div>
      </form>
      {error && <p>{error}</p>}
    </div>
  </div>
</div>

    </div>
  );
};

export default RegistrationForm;
