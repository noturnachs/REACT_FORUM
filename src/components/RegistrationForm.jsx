import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeaderIMG from "../assets/usc75_01ed.png";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    firstname: "",
    lastname: "",
    program: "",
    yearlevel: "",
  });
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    firstname: "",
    lastname: "",
    program: "",
    yearlevel: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  useEffect(() => {
    document.title = "TCC - Register";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      username,
      email,
      password,
      firstname,
      lastname,
      program,
      yearlevel,
    } = formData;
    const newErrors = {};

    if (!username) newErrors.username = "Username is required";
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (!firstname) newErrors.firstname = "First Name is required";
    if (!lastname) newErrors.lastname = "Last Name is required";
    if (!program) newErrors.program = "Program is required";
    if (!yearlevel) newErrors.yearlevel = "Year Level is required";
    if (!email.endsWith("@usc.edu.ph"))
      newErrors.email = "Email must have the domain @usc.edu.ph";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.status === 201) {
        setFormData({
          username: "",
          password: "",
          email: "",
          firstname: "",
          lastname: "",
          program: "",
          yearlevel: "",
        });
        setSuccessMessage("Registered Successfully! \nYou can now Login.");
      } else {
        const responseData = await response.json();
        setError(responseData.error || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate("/api/login");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 shadow-md rounded-md">
      <div className="flex items-center justify-center h-screen">
        <div className="card card-compact w-96 bg-base-100 shadow-xl">
          <figure>
            <img src={HeaderIMG} alt="USC_75" />
          </figure>
          <div className="card-body">
            {successMessage && (
              <div className="p-2 text-green-600">{successMessage}</div>
            )}
            <form onSubmit={handleSubmit} className="text-center">
              <div className="mb-4">
                <input
                  type="text"
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
              {/*  */}

              <div className="mb-4">
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="input input-bordered input-accent w-full max-w-xs"
                />
                {errors.firstname && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstname}
                  </p>
                )}
              </div>

              {/*  */}
              {/*  */}

              <div className="mb-4">
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="input input-bordered input-accent w-full max-w-xs"
                />
                {errors.lastname && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>
                )}
              </div>

              {/*  */}
              {/*  */}

              <div className="mb-4">
                <input
                  type="text"
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  placeholder="Program"
                  className="input input-bordered input-accent w-full max-w-xs"
                />
                {errors.program && (
                  <p className="text-red-500 text-xs mt-1">{errors.program}</p>
                )}
              </div>

              {/*  */}
              {/*  */}

              <div className="mb-4">
                <input
                  type="text"
                  name="yearlevel"
                  value={formData.yearlevel}
                  onChange={handleChange}
                  placeholder="Year Level"
                  className="input input-bordered input-accent w-full max-w-xs"
                />
                {errors.yearlevel && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.yearlevel}
                  </p>
                )}
              </div>

              {/*  */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
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
                {error && <p className="text-sm text-red-600 pb-4">{error}</p>}
                <button
                  type="submit"
                  className="btn btn-accent mb-5"
                  disabled={isLoading}
                >
                  {isLoading ? "Registering..." : "Register"}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
