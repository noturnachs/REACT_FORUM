import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import jwt_decode from "jwt-decode";
import defaultPersonImage from "../assets/person.jpg";

const DashboardNav = ({ setSelectedCategory }) => {
  const location = useLocation();
  const isStorePage = location.pathname === "/store";
  const isProfilePage = location.pathname === "/profile";
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [selectedCategoryName, setSelectedCategoryName] =
    useState("Categories");
  const [categories, setCategories] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [error, setError] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [deletedNotifications, setDeletedNotifications] = useState([]);

  

    const deleteNotification = (index) => {
      // console.log("Deleting notification at index:", index);

      setDeletedNotifications((prevDeletedNotifications) => [
        ...prevDeletedNotifications,
        notifications[index], // Keep track of deleted notifications
      ]);

      setNotifications((prevNotifications) => {
        const updatedNotifications = [...prevNotifications];
        updatedNotifications.splice(index, 1);

        // console.log("Updated notifications:", updatedNotifications);

        return updatedNotifications;
      });
    };

  const getOrders = async () => {
    try {

      const token = localStorage.getItem("token");
      const decodedToken = jwt_decode(token);

      const userID = decodedToken.id;

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

       // Add notifications for orders with status other than "confirming"
       const notificationsForChangedOrders = data
         .filter((order) => order.status !== "confirming")
         .map((order) => ({
           message: `Order #${order.id} - ${order.status}`,
         }));

       // Filter out duplicate notifications
       const uniqueNotifications = notificationsForChangedOrders.filter(
         (newNotification) =>
           !notifications.some(
             (existingNotification) =>
               existingNotification.message === newNotification.message
           )
       );

       // Filter out deleted notifications
       const updatedNotifications = uniqueNotifications.filter(
         (newNotification) =>
           !deletedNotifications.some(
             (deletedNotification) =>
               deletedNotification.message === newNotification.message
           )
       );

       // Update the notifications state
       setNotifications((prevNotifications) => [
         ...prevNotifications,
         ...updatedNotifications,
       ]);
       setUserOrders(data);
     } else if (response.status == 500) {
      //  console.log("No orders found");
       setError(true);
     } else {
       const errorData = await response.json();
       throw new Error(errorData.error);
     }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

 

  const handleNotificationClick = () => {
    getOrders();
    // console.log(userOrders)
    setShowNotifications(!showNotifications);
  };

  const handleProfileTab = () => {
    navigate("/profile");
  };

  useEffect(() => {
    // Get the JWT token from localStorage
    const token = localStorage.getItem("token");

    // Fetch categories from the backend
    fetch(`${import.meta.env.VITE_API_URL}/api/categories`)
      .then((response) => response.json())
      .then((data) => {
        setCategories([{ name: "All Categories", id: "all" }, ...data]);
      })
      .catch((error) => console.error("Error fetching categories:", error));

    if (token) {
      // Decode the JWT token to access user information
      const decodedToken = jwt_decode(token);
      setUser(decodedToken);

      // Fetch user profile photo
      fetch(`${import.meta.env.VITE_API_URL}/api/users/profilePhoto`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data && data.profilePhotoPath) {
            setProfilePhoto(
              `${import.meta.env.VITE_API_URL}${data.profilePhotoPath}`
            );
          }
        })
        .catch((error) =>
          console.error("Error fetching profile photo:", error)
        );
    } else {
      // Handle the case where the token is not present (user not authenticated)
      localStorage.removeItem("token");
      navigate("/api/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
    navigate("/api/login");
  };

  const toStore = () => {
    navigate("/store");
  };

  const goDash = () => {
    navigate("/dashboard");
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category === "All Categories" ? "" : category);
    setSelectedCategoryName(category);
  };

  const tccLink = isProfilePage ? goDash : isStorePage ? goDash : null;

  return (
    <div className="navbar bg-base-100">
      <a
        className="btn btn-ghost normal-case text-xl uscbrand font-bold"
        onClick={tccLink}
      >
        TCC
      </a>
      <div className="flex-1">
        {!isProfilePage && (
          <div
            className={`dropdown dropdown-hover ddnav ${
              isStorePage ? "hidden" : ""
            }`}
          >
            <label
              tabIndex={0}
              className="btn m-1 bg-[#13ac4c] text-white tracking-wider"
            >
              {selectedCategoryName}
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow bg-[#E1E8ED] rounded-box w-52"
            >
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="sas p-1 rounded-box"
                  onClick={() => handleCategoryClick(category.name)}
                >
                  <a>{category.name}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
        &nbsp;&nbsp;&nbsp;
        <button type="button" className="btn bg-[#FBBF16]" onClick={toStore}>
          <i className="fa-solid fa-store text-white"></i>
        </button>
      </div>

      <div className="flex-none gap-2 relative">
        <button
          type="button"
          className="btn btn-ghost btn-circle relative"
          onClick={handleNotificationClick}
        >
          <i className="fa-solid fa-bell text-xl"></i>
          {notifications.length > 0 && (
            <i
              className="fa fa-circle absolute -top-[-6px] -right-[-6px] text-red-500"
             
            ></i>

          )}
          {/* Notification popup */}
          {showNotifications && (
            <div className="absolute right-0 top-[5vh] mt-2 p-2 shadow menu bg-base-300 rounded-box w-52">
              {notifications.map((notification, index) => (
                <div key={index} className="p-2 border-b flex flex-row">
                  <div>
                    <span>{notification.message}</span>
                  </div>
                  <div>
                    <span
                      onClick={() => deleteNotification(index)}
                      className="btn"
                    >
                      <i className="fa fa-minus text-red-500"></i>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </button>

        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <img src={profilePhoto || defaultPersonImage} alt="Profile" />{" "}
              {/* Display user's profile picture */}
            </div>
          </label>
          <ul
            tabIndex={0}
            className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-300 rounded-box w-52"
          >
            <li onClick={handleProfileTab}>
              <a className="justify-between">
                {user.username}
                <span className="badge badge-success">Profile</span>
              </a>
            </li>

            <li>
              <a onClick={handleLogout} className="">
                Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardNav;
