import React, { useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import HeaderIMG from "../assets/usc75_01ed.png";

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
  
    const { username, password } = formData;
    const newErrors = {};
  
    if (!username) {
      newErrors.username = "Username is required";
    }
  
    if (!password) {
      newErrors.password = "Password is required";
    }
  
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
  
    try {
      const response = await axios.post(
        "http://localhost:3000/api/login",
        formData
      );
      
      if (response.status === 200) {
        console.log("Login successful :)");
        const token = response.data.token;
        localStorage.setItem("token", token);
        navigate("/dashboard");
      } 
    } catch (err) {
      // console.error(err); // Log the error for debugging
      if (err.response && err.response.status === 401 && err.response.data.error === "Invalid username or password") {
        setError("Invalid username or password");
      } else {
        setError("An error occurred while logging in. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegisterClick = () => {
    navigate("/api/register");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const imageSrc = useMemo(() => {
    return HeaderIMG;
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="card card-compact w-96 bg-base-100 shadow-xl">
        <figure>
          <img src={imageSrc} alt="USC_75" />
        </figure>
        <div className="card-body">
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="PASSWORD"
                  className="input input-bordered input-accent w-full max-w-xs"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-5 px-2 py-1 bg-inherit text-white-600 text-xs rounded"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
            <div className="flex flex-col">
              <button
                type="submit"
                className="btn btn-accent mb-5"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
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
