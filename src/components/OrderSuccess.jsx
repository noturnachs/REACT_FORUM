import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";




const OrderSuccess = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const { email, fullName, course, year, total, cart } = location.state;

  const Home = () => {
    navigate("/dashboard");
  }



  return (
    <>
      <div className="flex justify-center items-center h-screen">
        <div className="mockup-code">
          <pre data-prefix="1" className="bg-success text-warning-content">
            <code className="font-bold">Order Successfully Placed!</code>
          </pre>
          <pre data-prefix="2">
            <code></code>
          </pre>
          <pre data-prefix="3" className="bg-success text-warning-content">
            <code className="font-bold">Order Details:</code>
          </pre>
          <pre data-prefix="4" className="bg-warning text-warning-content">
            <code className="font-bold">
              $Email: <code className="font-normal">{email}</code>
            </code>
          </pre>
          <pre data-prefix="5" className="bg-warning text-warning-content">
            <code className="font-bold">
              $Customer_Name: <code className="font-normal">{fullName}</code>
            </code>
          </pre>
          <pre data-prefix="6" className="bg-warning text-warning-content">
            <code className="font-bold">
              $Course: <code className="font-normal">{course}</code>
            </code>
          </pre>
          <pre data-prefix="6" className="bg-warning text-warning-content">
            <code className="font-bold">
              $Year: <code className="font-normal">{year}</code>
            </code>
          </pre>
          <pre data-prefix="6" className="bg-warning text-warning-content">
            <code className="font-bold">
              $Total: <code className="font-normal">₱ {total}</code>
            </code>
          </pre>
          <div className="flex items-center justify-center mt-5">
            <button
              className="btn btn-error w-max h-[1px] normal-case hover:bg-[#943434] text-black border-none"
              onClick={Home}
            >
              Return home
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSuccess;
