import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import defaultPersonImage from "../assets/person.jpg";
import DashboardNav from "./DashboardNav";
import {
  fetchProfilePhoto,
  uploadProfilePhoto,
  decodeToken,
  validateFileType,
  handleSessionExpired,
  handleImageClick,
} from "./Funcs/ProfileFunctions";

const Profile = () => {
  const location = useLocation().pathname;
  // State variables
  const [selectedFile, setSelectedFile] = useState(null);
  const [showOrders, setShowOrders] = useState(false);
  const [user, setUser] = useState({});
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const fileInputRef = useRef(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [error, setError] = useState(false);

  const getOrders = async () => {
    try {
      const userID = user.id;
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/${userID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserOrders(data);
      } else if (response.status == 500) {
        console.log("No orders found");
        setError(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    // console.log(userOrders);
  }, [userOrders]);

  const showOrdersbtn = () => {
    getOrders();

    setShowOrders((prevShowOrders) => !prevShowOrders);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setShowPopup(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("User not authenticated");
      }
      await uploadProfilePhoto(token, selectedFile);
      alert("Profile image updated successfully!");
      // Additional logic to update UI
      setIsLoading(false);
    } catch (error) {
      console.error("Error updating profile photo:", error);
      setIsLoading(false);
      alert("Failed to update profile image");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (validateFileType(file)) {
        setSelectedFile(file);
        setShowPopup(true);
      } else {
        alert("Please select a GIF or image file.");
      }
    }
  };

  // Fetch user data and profile photo on mount
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      const decodedToken = decodeToken(token);
      setUser(decodedToken);
      fetchProfilePhoto(token)
        .then((photoPath) => {
          if (photoPath) {
            setProfilePhoto(photoPath);
          }
        })
        .catch((error) => {
          console.error("Error fetching profile photo:", error);
          alert("Failed to fetch profile photo");
        });
    } else {
      handleSessionExpired();
    }
  }, []);

  const handleEmailChange = async () => {
    try {
      const token = localStorage.getItem("token");
      const userID = user.id;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/update-email/${userID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newEmail: email }), // Assuming the new email is stored in the `email` state variable
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(data.message); // Show success message
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error); // Throw an error with the error message received from the API
      }
    } catch (error) {
      console.error("Error updating email:", error);
      alert("Failed to change email");
    }
  };

  return (
    <>
      <DashboardNav />
      <div className="max-w-md mx-auto p-3 mt-10 bg-primary shadow rounded">
        <div className="text-center mb-6">
          <div className="flex flex-col items-center">
            <img
              src={
                selectedFile
                  ? URL.createObjectURL(selectedFile)
                  : profilePhoto || defaultPersonImage
              }
              alt="Profile"
              className="rounded-full w-32 h-32 mx-auto border-2 border-error"
            />
            <span
              className="bg-gray-400 rounded-full p-2 w-10 mt-[-20px]"
              onClick={() => handleImageClick(fileInputRef)}
            >
              <i className="fa-solid fa-camera cursor-pointer text-white "></i>
            </span>
          </div>
          <h1 className="text-white text-2xl font-semibold mt-4">
            {user.username}
          </h1>
          <span className="text-white text-md font-semibold mt-4">
            {user.email}
          </span>

          <input
            type="email"
            placeholder="Change Email"
            className="input input-bordered input-primary w-full max-w-xs"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={handleEmailChange}
            className="btn btn-sm btn-warning mt-2"
            disabled={isLoading}
          >
            {isLoading ? "Updating Email..." : "Save Changes"}
          </button>
        </div>

        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/gif, image/jpeg, image/png"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        {showPopup && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Confirm Profile Picture</h3>
              <p className="py-4">
                Are you sure you want to update your profile picture?
              </p>
              <div className="modal-action">
                <button onClick={handleSubmit} className="btn btn-primary">
                  Yes, Update
                </button>
                <button
                  onClick={() => setShowPopup(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col max-w-2xl mx-auto p-3 mt-10 bg-inherit rounded">
        <div className="flex flex-col">
          <button
            type="button"
            className="btn btn-success"
            onClick={showOrdersbtn}
          >
            My Orders
          </button>

          {showOrders && (
            <>
              {error && (
                <div className="flex mx-auto text-white mt-3 bg-red-500 p-5 w-full items-center justify-center rounded font-bold">
                  <h1>No Orders Found</h1>
                </div>
              )}
              {userOrders &&
                userOrders.map((order) => (
                  <div
                    className="w-full mx-auto p-2 mt-2 bg-gray-200 shadow rounded text-black flex flex-col"
                    key={order.id}
                  >
                    {order.status == "confirming" && (
                      <div className="text-black bg-info w-full mx-auto p-2 rounded font-bold text-lg">
                        Waiting Confirmation from Seller
                      </div>
                    )}

                    {order.status == "preparing" && (
                      <div className="text-black bg-warning w-full mx-auto p-2 rounded font-bold text-lg">
                        Order is being prepared
                      </div>
                    )}

                    {order.status == "ready" && (
                      <div className="text-black bg-success w-full mx-auto p-2 rounded font-bold text-lg">
                        Order Ready for Pickup
                      </div>
                    )}

                    {order.status == "cancelled" && (
                      <div className="text-black bg-error w-full mx-auto p-2 rounded font-bold text-lg">
                        Order has been cancelled
                      </div>
                    )}

                    <div className="mb-4">
                      <p className="text-xl font-bold">Order: #{order.id}</p>

                      <p>
                        <span className="font-bold">Email:</span> {order.email}
                      </p>
                      <p>
                        <span className="font-bold">Name:</span>{" "}
                        {order.fullName}
                      </p>
                      <p>
                        <span className="font-bold">Course:</span>{" "}
                        {order.course}
                      </p>
                      <p>
                        <span className="font-bold">Year:</span> {order.year}
                      </p>
                      <p>
                        <span className="font-bold">Total:</span> ₱{order.total}
                      </p>
                      <p>
                        <span className="font-bold">Date Purchased:</span>{" "}
                        {new Date(order.timestamp).toLocaleString()}
                      </p>

                      <div className="mt-2">
                        <h2 className="text-lg font-bold mb-2">
                          Items Purchased:
                        </h2>
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center mb-2">
                            <img
                              src={item.product.imageSrc}
                              alt={item.product.imageAlt}
                              className="w-12 h-12 object-cover mr-4 rounded"
                            />
                            <div>
                              <p className="text-md font-bold">
                                {item.product.name}
                              </p>
                              <p>
                                Price: {item.product.price.replace("$", "₱")}
                              </p>
                              <p>Quantity: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
