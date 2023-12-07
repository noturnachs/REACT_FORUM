import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, fullName, course, year, total, cart } = location.state;

  const Home = () => {
    navigate("/dashboard");
  };

  return (
    <>
      <div className="flex justify-center items-center h-screen min-h-full mt-10 mb-10">
        <div className="mockup-code w-[50%]">
          <pre data-prefix="1" className="bg-success text-warning-content">
            <code className="font-bold">Order Successfully Placed!</code>
          </pre>
          <pre data-prefix="2" className="bg-success text-warning-content">
            <code className="font-bold whitespace-normal">
              Getting your Order ready!
            </code>
          </pre>
          <pre data-prefix="3">
            <code></code>
          </pre>
          <pre data-prefix="4" className="bg-success text-warning-content">
            <code className="font-bold">$Order_Details</code>
          </pre>
          <pre data-prefix="5" className="bg-warning text-warning-content">
            <code className="font-bold">
              $Email: <code className="font-normal">{email}</code>
            </code>
          </pre>
          <pre data-prefix="6" className="bg-warning text-warning-content">
            <code className="font-bold">
              $Customer_Name: <code className="font-normal">{fullName}</code>
            </code>
          </pre>
          <pre data-prefix="7" className="bg-warning text-warning-content">
            <code className="font-bold">
              $Course: <code className="font-normal">{course}</code>
            </code>
          </pre>
          <pre data-prefix="8" className="bg-warning text-warning-content">
            <code className="font-bold">
              $Year: <code className="font-normal">{year}</code>
            </code>
          </pre>

          <div className="flex flex-col">
            {cart.map((cartI, i) => {
              return (
                <div
                  key={i}
                  className="flex flex-row justify-between px-5 mt-5"
                >
                  <p className="text-sm font-bold text-green-500">
                    {cartI.name}
                  </p>
                  <p className="text-sm font-bold text-yellow-500">
                    ₱ {cartI.price.replace("$", "")}
                  </p>
                </div>
              );
            })}
            <div className="flex flex-row justify-between text-white font-bold">
              <div className="my-5 mx-5">Total </div>
              <div className="my-5 mx-5 ">₱ {total}</div>
            </div>
          </div>

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
