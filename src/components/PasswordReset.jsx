import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const PasswordReset = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [countdown, setCountdown] = useState(5);
let timer;
  useEffect(() => {
    
    fetch(`${import.meta.env.VITE_API_URL}/api/verify/${token}`)
      .then(async (response) => {
        if (response.ok) {
          const b4token = atob(token);
          const jsonObject = JSON.parse(b4token);
          const email = jsonObject.email;
          setUserEmail(email);
          console.log("OK!");
        } else {
          const errorData = await response.json();

          
          
          navigate(`/api/login?message=${encodeURIComponent(errorData.error)}`);
        }
      })
      .catch((error) => {
        console.error("Error verifying token:", error);
      });

    
  }, [token, navigate, countdown]);

  const handleChangePassword = async () => {
    if (password === repeatPassword) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/update-password/${userEmail}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ newPassword: password }),
          }
        );

        if (response.ok) {
          setSuccess("Password updated successfully");
          setError("");
          setPassword("");
          setRepeatPassword("");

          if (countdown > 0) {
            timer = setInterval(() => {
              setCountdown((prevCountdown) => prevCountdown - 1);
            }, 1000);
          }

          setTimeout(() => {
            navigate("/api/login?message=Password%20updated%20successfully");
          }, 5000);
        } else {
          const errorData = await response.json();
          console.error("Password update failed:", errorData.error);
          setSuccess("");
          setError(errorData.error);
        }
      } catch (error) {
        console.error("An error occurred during password update:", error);
        setError("An unexpected error occurred");
        setSuccess("");
      }
    } else {
      setError("Passwords do not match");
      setSuccess("");
    }

    return () => clearInterval(timer);
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col bg-white p-5 space-y-5 rounded-md w-auto lg:w-[50%]">
        <h1 className="text-black font-bold">Reset Password</h1>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        {success && (
          <p className="text-green-500 text-xs mt-1">
            {success}. Redirecting in {countdown}s
          </p>
        )}
        <input
          type="password"
          className="input"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          className="input"
          placeholder="Repeat New Password"
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
        />
        <button className="btn btn-error" onClick={handleChangePassword}>
          Change password
        </button>
      </div>
    </div>
  );
};

export default PasswordReset;
