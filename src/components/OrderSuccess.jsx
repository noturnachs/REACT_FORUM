import React, { useState, useEffect } from "react";
import { isTokenExpired } from "../utils/authUtils";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";

const OrderSuccess = () => {
  return <div>Order successfully placed!</div>;
};

export default OrderSuccess;
