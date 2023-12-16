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
    <>
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
                    <p className="text-red-500 text-xs mt-1">
                      {errors.username}
                    </p>
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
                    <p className="text-red-500 text-xs mt-1">
                      {errors.lastname}
                    </p>
                  )}
                </div>

                {/*  */}
                {/*  */}

                <div className="mb-4">
                  <select
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    className="input input-bordered input-accent w-full max-w-xs"
                  >
                    <option value="">Select a Program</option>
                    <option value="Bachelor of Science in Architecture">
                      Bachelor of Science in Architecture
                    </option>
                    <option value="Bachelor of Landscape Architecture">
                      Bachelor of Landscape Architecture
                    </option>
                    <option value="Bachelor of Science in Interior Design">
                      Bachelor of Science in Interior Design
                    </option>
                    <option value="Bachelor of Fine Arts major in Advertising Arts or Cinema">
                      Bachelor of Fine Arts major in Advertising Arts or Cinema
                    </option>
                    <option value="Bachelor of Arts in Anthropology">
                      Bachelor of Arts in Anthropology
                    </option>
                    <option value="Bachelor of Science in Biology">
                      Bachelor of Science in Biology
                    </option>
                    <option value="Bachelor of Science in Marine Biology">
                      Bachelor of Science in Marine Biology
                    </option>
                    <option value="Bachelor of Science in Chemistry">
                      Bachelor of Science in Chemistry
                    </option>
                    <option value="Bachelor of Arts in English Language Studies">
                      Bachelor of Arts in English Language Studies
                    </option>
                    <option value="Bachelor of Arts in Literary and Cultural Studies with Creative Writing">
                      Bachelor of Arts in Literary and Cultural Studies with
                      Creative Writing
                    </option>
                    <option value="Bachelor of Arts in Communication major in Media">
                      Bachelor of Arts in Communication major in Media
                    </option>
                    <option value="Bachelor of Science in Computer Science">
                      Bachelor of Science in Computer Science
                    </option>
                    <option value="Bachelor of Science in Information Systems">
                      Bachelor of Science in Information Systems
                    </option>
                    <option value="Bachelor of Science in Information Technology">
                      Bachelor of Science in Information Technology
                    </option>
                    <option value="Bachelor of Science in Applied Mathematics">
                      Bachelor of Science in Applied Mathematics
                    </option>
                    <option value="Bachelor of Philosophy">
                      Bachelor of Philosophy
                    </option>
                    <option value="Bachelor of Science in Applied Physics">
                      Bachelor of Science in Applied Physics
                    </option>
                    <option value="Bachelor of Science in Psychology">
                      Bachelor of Science in Psychology
                    </option>
                    <option value="Bachelor of Science in Nursing">
                      Bachelor of Science in Nursing
                    </option>
                    <option value="Bachelor of Science in Nutrition and Dietetics">
                      Bachelor of Science in Nutrition and Dietetics
                    </option>
                    <option value="Bachelor of Science in Pharmacy">
                      Bachelor of Science in Pharmacy
                    </option>
                    <option value="Bachelor of Arts in Political Science major in International Relations and Foreign Service, Law and Policy Studies">
                      Bachelor of Arts in Political Science major in
                      International Relations and Foreign Service, Law and
                      Policy Studies
                    </option>
                    <option value="Bachelor of Science in Accountancy">
                      Bachelor of Science in Accountancy
                    </option>
                    <option value="Bachelor of Science in Management Accounting">
                      Bachelor of Science in Management Accounting
                    </option>
                    <option value="Bachelor of Science in Business Administration major in Financial Management">
                      Bachelor of Science in Business Administration major in
                      Financial Management
                    </option>
                    <option value="Bachelor of Science in Business Administration major in Human Resource Management">
                      Bachelor of Science in Business Administration major in
                      Human Resource Management
                    </option>
                    <option value="Bachelor of Science in Business Administration major in Marketing Management">
                      Bachelor of Science in Business Administration major in
                      Marketing Management
                    </option>
                    <option value="Bachelor of Science in Business Administration major in Operations Management">
                      Bachelor of Science in Business Administration major in
                      Operations Management
                    </option>
                    <option value="Bachelor of Science in Entrepreneurship">
                      Bachelor of Science in Entrepreneurship
                    </option>
                    <option value="Bachelor of Science in Economics">
                      Bachelor of Science in Economics
                    </option>
                    <option value="Bachelor of Science in Hospitality Management">
                      Bachelor of Science in Hospitality Management
                    </option>
                    <option value="Bachelor of Science in Tourism Management">
                      Bachelor of Science in Tourism Management
                    </option>
                    <option value="Bachelor of Secondary Education major in Science">
                      Bachelor of Secondary Education major in Science
                    </option>
                    <option value="Bachelor of Special Needs Education specialization in Early Childhood Education-Montessori Education">
                      Bachelor of Special Needs Education specialization in
                      Early Childhood Education-Montessori Education
                    </option>
                    <option value="Bachelor of Secondary Education major in Mathematics">
                      Bachelor of Secondary Education major in Mathematics
                    </option>
                    <option value="Bachelor of Secondary Education major in Science">
                      Bachelor of Secondary Education major in Science
                    </option>
                    <option value="Bachelor of Science in Chemical Engineering">
                      Bachelor of Science in Chemical Engineering
                    </option>
                    <option value="Bachelor of Science in Civil Engineering">
                      Bachelor of Science in Civil Engineering
                    </option>
                    <option value="Bachelor of Science in Computer Engineering">
                      Bachelor of Science in Computer Engineering
                    </option>
                    <option value="Bachelor of Science in Electrical Engineering">
                      Bachelor of Science in Electrical Engineering
                    </option>
                    <option value="Bachelor of Science in Electronics Engineering">
                      Bachelor of Science in Electronics Engineering
                    </option>
                    <option value="Bachelor of Science in Industrial Engineering">
                      Bachelor of Science in Industrial Engineering
                    </option>
                    <option value="Bachelor of Science in Mechanical Engineering">
                      Bachelor of Science in Mechanical Engineering
                    </option>
                  </select>
                  {errors.program && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.program}
                    </p>
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
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>
                <div className="flex flex-col">
                  {error && (
                    <p className="text-sm text-red-600 pb-4">{error}</p>
                  )}
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
      <footer className="footer p-10 bg-base-300 flex">
        <nav>
          <header className="footer-title text-white">
            The Carolinian Connection
          </header>
          <p className="text-justify">
            Embark on a digital revolution designed exclusively for the dynamic
            community of University of San Carlos students! Say hello to "The
            Carolinian Connection", where tech meets the unmistakable Carolinian
            spirit. It's not just an app; it's your passport to a world of
            seamless communication, interactive forums, and a marketplace
            curated for the USC experience. Let's redefine the way Carolinians
            connect, engage, and thrive together!
          </p>
        </nav>
      </footer>
      <footer className="footer footer-center p-4 bg-base-300 text-base-content">
        <aside className="flex flex-col">
          <div className="text-md">
            Made with <span className="text-red-500">&#10084;</span>
          </div>
          <div className="flex flex-col  font-bold lg:flex-row lg:space-x-10">
            <ul>
              <a href="https://github.com/noturnachs" target="_blank">
                Dan Lius Monsales
              </a>
            </ul>
            <ul>
              <a href="https://github.com/prognewb" target="_blank">
                Niño Jan Roz Cabatas
              </a>
            </ul>
            <ul>
              <a href="https://github.com/clandy07" target="_blank">
                Eduardo Miguel Cortes
              </a>
            </ul>
            <ul>
              <a href="https://github.com/graysonLL" target="_blank">
                Liam Michael Jones
              </a>
            </ul>
          </div>
        </aside>
      </footer>
    </>
  );
};

export default RegistrationForm;
