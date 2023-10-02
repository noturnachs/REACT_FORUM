import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({ username: "", password: "" }); // State for validation errors
  const [error, setError] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear the corresponding error when the user starts typing
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password } = formData;
    const newErrors = {};

    // Check if username is empty
    if (!username) {
      newErrors.username = "Username is required";
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
        "http://localhost:3000/api/login",
        formData
      );

      console.log("Login successful:", response.data);
      const token = response.data.token;
      localStorage.setItem("token", token);

      navigate("/dashboard");
    } catch (err) {
      setError("Invalid username or password. Please try again.");
    }
  };

  const handleRegisterClick = () => {
    // Redirect to /api/register when the "Register" button is clicked
    navigate("/api/register");
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 shadow-md rounded-md">
      <form onSubmit={handleSubmit} className="text-center">
        <div className="mb-4">
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="USERNAME"
            className="input input-bordered input-accent w-full max-w-xs"
          />
          {errors.username && (
            <p className="text-red-500 text-xs mt-1">{errors.username}</p>
          )}
        </div>
        <div className="mb-4">
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="PASSWORD"
            className="input input-bordered input-accent w-full max-w-xs"
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>
        <div className="flex flex-col">
          <button type="submit" className="btn btn-accent mb-5">
            Login
          </button>
          <button
            type="button"
            className="btn btn-accent"
            onClick={handleRegisterClick}
          >
            Register
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
