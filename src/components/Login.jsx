import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import HeaderIMG from "../assets/usc75_01ed.png"



const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({ username: "", password: "" }); // State for validation errors
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear the corresponding error when the user starts typing
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);


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
      setIsLoading(false);
      return;
    }

    

    try {
      const response = await axios.post(
        "https://backendforum.ngrok.app/api/login",
        formData
      );

      console.log("Login successful :)");
      const token = response.data.token;
      localStorage.setItem("token", token);

      navigate("/dashboard");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        // Unauthorized (wrong username or password)
        setError("Invalid username or password. Please try again.");
      } else {
        // Other error (e.g., network error)
        setError("An error occurred while logging in. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = () => {
    // Redirect to /api/register when the "Register" button is clicked
    navigate("/api/register");
  };

  return (
    <div className="flex items-center justify-center h-screen">
    <div className="card card-compact w-96 bg-base-100 shadow-xl">
      <figure><img src={HeaderIMG} alt="USC_75" /></figure>
      <div className="card-body">
      {error && (
  <p className="text-red-500 text-xs mt-1">{error}</p>
)}
      
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
          <button type="submit" className="btn btn-accent mb-5" disabled={isLoading}>
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
    </div>
  </div>
  
  );
};

export default LoginForm;
