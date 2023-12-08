import React, { useState } from "react";

const ForgotP = () => {
  const [userEmail, setUserEmail] = useState("");
  const [successS, setSuccessS] = useState("");
  const [errorM, setErrorM] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsButtonDisabled(true); 

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: userEmail }),
        }
      );

      if (response.ok) {
        const { message } = await response.json();
        setSuccessS(message);
        setErrorM("");
      } else {
        const { error } = await response.json();
        console.error("Password reset failed:", error);
        setErrorM(error);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setErrorM(err);
    } finally {
      setIsButtonDisabled(false); 
    }
  };

  return (
    <div className="flex flex-col w-full bg-info p-5 space-y-3 rounded-lg mt-5">
      <h2 className="text-black font-bold">Forgot Password</h2>
      {successS && (
        <div className="bg-green-300 rounded p-2">
          <p className="text-sm text-black ">{successS}</p>
        </div>
      )}
      {errorM && <p className="text-sm text-red-500 font-bold">{errorM}</p>}
      <input
        className="input"
        type="email"
        value={userEmail}
        onChange={(e) => setUserEmail(e.target.value)}
        placeholder="Enter email"
      />
      <button
        className="btn btn-success"
        onClick={handleSubmit}
        disabled={isButtonDisabled}
      >
        Reset Password
      </button>
    </div>
  );
};

export default ForgotP;
