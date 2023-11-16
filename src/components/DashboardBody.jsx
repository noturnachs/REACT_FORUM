import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import { isTokenExpired } from "../utils/authUtils";

const DashboardBody = ({ selectedCategory }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [posts, setPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [newPostCategory, setNewPostCategory] = useState("");
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [showComments, setShowComments] = useState({});
  const [userLikes, setUserLikes] = useState({});
  const [isLiking, setIsLiking] = useState({});
  const [isCommenting, setIsCommenting] = useState({});
  const [newPostImage, setNewPostImage] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const videoRefs = useRef({});
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [currentlyPlayingVideo, setCurrentlyPlayingVideo] = useState(null);
  const [isFullscreenVideo, setIsFullscreenVideo] = useState(false);
  const [users, setUsers] = useState([]);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(null);
  const [announcement, setAnnouncement] = useState("");


  // Fetch users from the backend

  // Update user role
  const updateUserRole = (userId, newRole) => {
    if (user.username !== "dan") {
      alert("Only specific admin can change roles.");
      return;
    }
    fetch(`https://backendforum.ngrok.app/api/users/updateRole/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ role: newRole }),
    })
      .then((response) => {
        if (response.ok) {
          fetchUsers(); // Re-fetch users to update the UI
          alert(`User role updated successfully to ${newRole}.`); // Show success alert
        } else {
          // If the response is not ok, handle based on the response status code
          response.json().then((json) => {
            if (response.status === 403) {
              alert(json.error); // Show the error message from the server
            } else {
              throw new Error("Failed to update user role.");
            }
          });
        }
      })
      .catch((error) => {
        console.error("Error updating user role:", error);
        alert(`Failed to update user role: ${error.message || error}`); // Show error alert
      });
  };

  const handleIntersectionChange = (entries) => {
    if (isFullscreenVideo) return; // Skip if any video is in fullscreen

    entries.forEach((entry) => {
      const videoId = entry.target.getAttribute("data-video-id");
      const videoElement = videoRefs.current[videoId];

      if (entry.isIntersecting ) {
        videoElement.play();
      } else if (!entry.isIntersecting) {
        videoElement.pause();
      }
    });
  };

  useEffect(() => {
    // Fullscreen change handler
    const handleFullScreenChange = () => {
      const videoElement = document.fullscreenElement;
      if (videoElement && videoElement.tagName === "VIDEO") {
        setIsFullscreenVideo(true); // Set state to true when a video enters fullscreen
        videoElement.play();
      } else {
        setIsFullscreenVideo(false); // Set state to false when exiting fullscreen
      }
    };

    // Set up the fullscreen change event listener
    document.addEventListener("fullscreenchange", handleFullScreenChange);

    // Set up the intersection observer
    const observer = new IntersectionObserver(handleIntersectionChange);

    posts.forEach((post) => {
      const videoId = post.id;
      if (videoRefs.current[videoId]) {
        observer.observe(videoRefs.current[videoId]);
      }
    });

    // Clean up function
    return () => {
      // Remove the fullscreen change event listener
      document.removeEventListener("fullscreenchange", handleFullScreenChange);

      // Disconnect the intersection observer
      posts.forEach((post) => {
        const videoId = post.id;
        if (videoRefs.current[videoId]) {
          observer.unobserve(videoRefs.current[videoId]);
        }
      });
    };
  }, [posts, currentlyPlayingVideo, isFullscreenVideo]); // Add isFullscreenVideo to the dependency array

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height to auto
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scrollHeight
    }
  };
  const toggleAdminPanel = () => {
    setIsAdminPanelOpen(!isAdminPanelOpen);
  };

  const showUserMng = () => {
    setIsUserPanelOpen(!isUserPanelOpen);
  };

  const fetchPosts = () => {
    fetch("https://backendforum.ngrok.app/api/posts/all")
      .then((response) => response.json())
      .then(async (postsData) => {
        setPosts(postsData);
        const initialLikes = {};
        const initialUserLikes = {};

        setSessionExpired(false);

        await Promise.all(
          postsData.map(async (post) => {
            if (sessionExpired) return;

            // Fetch likes count for each post
            const likesResponse = await fetch(
              `https://backendforum.ngrok.app/api/posts/${post.id}/likesCount`
            );
            if (likesResponse.ok) {
              const likesData = await likesResponse.json();
              initialLikes[post.id] = likesData.count;
            }

            // Fetch user's like status for each post
            const userLikesResponse = await fetch(
              `https://backendforum.ngrok.app/api/posts/${post.id}/userLikes`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
            if (userLikesResponse.ok) {
              const userLikesData = await userLikesResponse.json();
              initialUserLikes[post.id] = userLikesData.liked;
            } else {
              const errorResponse = await userLikesResponse.json();

              console.error(
                "Error fetching user's like status:",
                errorResponse
              );
            }
          })
        );

        setLikes(initialLikes);
        setUserLikes(initialUserLikes);
      })
      .catch((error) => console.error("Error fetching posts:", error));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("token");
      alert("Your session has expired. Please login again.");
      navigate("/api/login");
      return;
    }

    fetch("https://backendforum.ngrok.app/api/announcements/latest")
    .then(response => response.json())
    .then(data => {
      if (data && data.message) {
        setAnnouncement(data.message);
      }
    })
    .catch(error => console.error("Error fetching announcement:", error));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Fetch categories from the backend
    fetch("https://backendforum.ngrok.app/api/categories")
      .then((response) => response.json())
      .then((data) => setCategories(data))
      .catch((error) => console.error("Error fetching categories:", error));

    if (token) {
      const decodedToken = jwt_decode(token);
      setUser(decodedToken);
      setIsAdmin(decodedToken.role === "admin");
      setIsMuted(decodedToken.status === "muted" ? "muted" : "none");
      

      
    }
    fetchPosts();
    fetchUsers();

    const intervalId = setInterval(fetchPosts, 60000);

    return () => clearInterval(intervalId);
  }, []);

 

  const fetchUsers = () => {
    const token = localStorage.getItem("token"); // Retrieve the stored token

    fetch("https://backendforum.ngrok.app/api/users", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // console.log("Fetched Users:", data);  // Debugging line
        setUsers(data);
      })
      .catch((error) => console.error("Error fetching users:", error));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/api/login");
  };

  const handleLike = async (postId) => {
    setIsLiking((prev) => ({ ...prev, [postId]: true }));
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("token");
      alert("Your session has expired. Please login again.");
      navigate("/api/login");
      return;
    }

    const currentlyLiked = userLikes[postId];
    try {
      const response = await fetch(
        `https://backendforum.ngrok.app/api/posts/${postId}/${
          currentlyLiked ? "unlike" : "like"
        }`,
        {
          method: currentlyLiked ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setLikes((prevLikes) => ({
          ...prevLikes,
          [postId]: currentlyLiked
            ? prevLikes[postId] - 1
            : prevLikes[postId] + 1,
        }));
        setUserLikes((prevUserLikes) => ({
          ...prevUserLikes,
          [postId]: !currentlyLiked,
        }));
      } else {
        console.error("Error updating the like");
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setIsLiking((prev) => ({ ...prev, [postId]: false }));
  };




  const updateAnnouncement = () => {
    const token = localStorage.getItem("token");
    fetch("https://backendforum.ngrok.app/api/announcements/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ message: announcement })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to update announcement");
      }
      return response.json();
    })
    .then(() => {
      alert("Announcement updated successfully");
    })
    .catch(error => {
      console.error("Error updating announcement:", error);
      alert(`Error updating announcement: ${error.message || error}`);
    });
  };
  

  const handleShowComments = async (postId) => {
    // Toggle visibility
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));

    // If comments are being shown for the first time, fetch them
    if (!showComments[postId]) {
      try {
        const response = await fetch(
          `https://backendforum.ngrok.app/api/posts/${postId}/comments`
        );
        if (response.ok) {
          const data = await response.json();
          setComments((prev) => ({ ...prev, [postId]: data }));
        } else {
          console.error("Error fetching comments");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const handleAddComment = async (postId) => {
    setIsCommenting((prev) => ({ ...prev, [postId]: true }));
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("token");
      alert("Your session has expired. Please login again.");
      navigate("/api/login");
      return;
    }

    const commentText = newComment[postId];
    if (!commentText) {
      alert("Comment cannot be empty.");
      return;
    }

    try {
      const response = await fetch(
        `https://backendforum.ngrok.app/api/posts/${postId}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ comment: commentText }),
        }
      );

      if (response.ok) {
        setNewComment({ ...newComment, [postId]: "" }); // Reset the comment input

        // Fetch updated comments and ensure the comments section is shown
        const commentsResponse = await fetch(
          `https://backendforum.ngrok.app/api/posts/${postId}/comments`
        );
        if (commentsResponse.ok) {
          const updatedComments = await commentsResponse.json();
          setComments((prev) => ({ ...prev, [postId]: updatedComments }));
          setShowComments((prev) => ({ ...prev, [postId]: true })); // Ensure comments are shown
        } else {
          console.error("Error fetching updated comments");
        }
      } else {
        console.error("Error adding comment");
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setIsCommenting((prev) => ({ ...prev, [postId]: false }));
  };

  const handlePost = async () => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("token");
      alert("Your session has expired. Please login again.");
      navigate("/api/login");
      return;
    }
    if (!newPostTitle || !newPostContent || !newPostCategory) {
      alert("Please enter title, content, and category for the new post.");
      return;
    }

    setIsPosting(true);

    const formData = new FormData();
    formData.append("title", newPostTitle);
    formData.append("content", newPostContent);
    formData.append("category", newPostCategory);
    if (newPostImage) {
      formData.append("image", newPostImage);
    }

    try {
      const username = user.username;

      const res1 = await fetch("https://backendforum.ngrok.app/api/users/findUserId", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
      const data1 = await res1.json();

      if (data1.userId) {
        const userId = data1.userId;

        const res2 = await fetch("https://backendforum.ngrok.app/api/posts/create", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        const data2 = await res2.json();

        if (res2.ok) {
          // Post creation was successful
          setNewPostTitle("");
          setNewPostContent("");
          setNewPostCategory("");
          setNewPostImage(null); // Reset the image input
          handleResetInput();
          setFileUploaded(false);
          fetchPosts(); // Refresh the posts
        } else {
          // Handle errors if post creation was not successful
          console.error("Error creating post:", data2.message);
        }
      } else {
        console.error("User not found");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleResetInput = () => {
    setNewPostImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    setNewPostImage(e.target.files[0]);
    setFileUploaded(e.target.files.length > 0);
  };

  const generateShareLink = (postId) => {
    const baseUrl = window.location.origin; // Get the base URL of your app
    return `${baseUrl}/post/${postId}`; // Assuming you have a route like '/post/:id'
  };

  const getFileType = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    if (
      ["png", "jpg", "jpeg", "gif", "bmp", "heif", "heic"].includes(extension)
    ) {
      return "image";
    } else if (["mp4", "webm", "ogg", "mov"].includes(extension)) {
      return "video";
    } else if (["mp3", "wav", "ogg", "m4a", "aac"].includes(extension)) {
      return "audio";
    } else if (extension === "pdf") {
      return "pdf";
    }
    return "other";
  };

  const handleAddCategory = () => {
    const newCategory = prompt("Enter new category name:");
    if (newCategory) {
      fetch("https://backendforum.ngrok.app/api/categories/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name: newCategory }),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Network response was not ok.");
        })
        .then((data) => {
          console.log("Category added:", data);
          setCategories([
            ...categories,
            { name: newCategory, id: data.newCategoryId },
          ]);
        })
        .catch((error) => console.error("Error adding category:", error));
    }
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      fetch(`https://backendforum.ngrok.app/api/categories/delete/${categoryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Network response was not ok.");
        })
        .then(() => {
          console.log("Category deleted");
          setCategories(
            categories.filter((category) => category.id !== categoryId)
          );
        })
        .catch((error) => console.error("Error deleting category:", error));
    }
  };

  const handleDeletePost = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("token");
      alert("Your session has expired. Please login again.");
      navigate("/api/login");
      return;
    }

    if (window.confirm("Are you sure you want to delete this post?")) {
      fetch(`https://backendforum.ngrok.app/api/posts/delete/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (response.ok) {
            fetchPosts(); // Refresh posts after deletion
          } else {
            throw new Error("Failed to delete post");
          }
        })
        .catch((error) => {
          console.error("Error deleting post:", error);
        });
    }
  };

  // Function to mute or unmute a user
  const updateUserStatus = (userId, newStatus) => {
    if (user.username !== "dan") {
      alert("Only specific admin can change roles.");
      return;
    }

    fetch(`https://backendforum.ngrok.app/api/users/updateStatus/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update user status");
        }
        return response.json();
      })
      .then(() => {
        // Update the users state to reflect the new status
        setUsers((prevUsers) =>
          prevUsers.map((u) => {
            if (u.id === userId) {
              return { ...u, status: newStatus };
            }
            return u;
          })
        );
        alert(`User status updated: ${newStatus}`);
      })
      .catch((error) => {
        console.error("Error updating user status:", error);
        alert(`Error updating user status: ${error.message || error}`);
      });
  };

  return (
    <>
      <div className="max-w-md mx-auto p-2 mt-10">
        <div className="flex flex-col justify-center items-center">
        {announcement && (
  <div className="flex justify-center items-center">
    <button className="btn btn-warning mb-5 w-full">
      {announcement}
    </button>
  </div>
)}
          {isMuted === "muted" && (
            <div className="flex justify-center items-center">
              <button className="btn btn-error mb-5 w-full">
                You are muted bitch! Contact Admins
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="w-max">
              <button
                onClick={toggleAdminPanel}
                className="btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded my-4"
              >
                {isAdminPanelOpen ? "Close" : "Show"} Admin Panel
              </button>

              {isAdminPanelOpen && (
                <div className="card w-full shadow-xl mb-10 bg-[#641ae6] ">
                  <div className="card-body w-[25rem]">
                    <h2 className="card-title text-gray-800 text-lg">
                      Admin Panel
                    </h2>
                    <div className="flex flex-col justify-center items-center">
                    <div>
  <input
    type="text"
    placeholder="Add an announcement"
    value={announcement}
    onChange={(e) => setAnnouncement(e.target.value)}
    className="input input-bordered w-full mb-2"
  />
  <button
    onClick={() => updateAnnouncement()}
    className="btn btn-success"
  >
    Add announcement
  </button>
</div>
                      <button
                        onClick={showUserMng}
                        className="btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded my-4"
                      >
                        {isUserPanelOpen ? "Hide" : "Show"} Users
                      </button>
                      {isUserPanelOpen && (
                        <div className="p-2 bg-white shadow-lg rounded-lg w-full">
                          <h2 className="text-xl font-semibold mb-5">
                            User Management
                          </h2>
                          <div className="overflow-x-auto">
                            <table className="min-w-full leading-normal">
                              <thead>
                                <tr>
                                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Username
                                  </th>
                                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Email
                                  </th>
                                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Role
                                  </th>
                                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {users.map((user) => (
                                  <tr
                                    key={user.id}
                                    className="hover:bg-gray-100"
                                  >
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                      {user.username}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                      {user.email}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                      <select
                                        className="rounded border-gray-300 p-2"
                                        value={user.role}
                                        onChange={(e) =>
                                          updateUserRole(
                                            user.id,
                                            e.target.value
                                          )
                                        }
                                      >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                      </select>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                      <select
                                        className="rounded border-gray-300 p-2"
                                        value={user.status}
                                        onChange={(e) =>
                                          updateUserStatus(
                                            user.id,
                                            e.target.value
                                          )
                                        }
                                      >
                                        <option value="none">Unmuted</option>
                                        <option value="muted">Muted</option>
                                      </select>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleAddCategory}
                        className="btn bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4 mt-4"
                      >
                        Add Category
                      </button>
                      <div className="space-y-3">
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center justify-between bg-gray-100 p-3 rounded-lg shadow"
                          >
                            <span className="text-gray-700 font-medium">
                              {category.name}
                            </span>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="btn bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mb-10 form-control">
            <select
              className="input input-primary w-full mb-2"
              value={newPostCategory}
              onChange={(e) => setNewPostCategory(e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Title"
              className="input input-primary w-full mb-2"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
            />
            <textarea
              rows="4"
              ref={textareaRef}
              placeholder={
                isMuted == "muted"
                  ? "You are muted and cannot post"
                  : "What's on your mind?"
              }
              className="w-full h-16 rounded-lg focus:outline-none focus:border-blue-500 p-2 mr-2 resize-none"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              onInput={adjustHeight}
              disabled={isMuted == "muted" ? true:false}
            ></textarea>
            <div className="mt-2">
              <label
                htmlFor="file-upload"
                className="flex justify-center items-center px-4 py-2 btn btn-primary tracking-wide uppercase border border-blue cursor-pointer"
              >
                <span className="text-base leading-normal">
                  <i className="fa-solid fa-image"></i>
                  {fileUploaded ? " File Uploaded" : ""}
                </span>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*,video/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/heic,image/heif"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <button
              onClick={handlePost}
              className={`btn btn-primary mt-2 ${
                isPosting || isMuted == "muted" ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isPosting || isMuted == "muted" ? true : false}
            >
              {isPosting ? "Posting..." : "Post"}
            </button>
          </div>

          {posts
            .filter((post) =>
              selectedCategory === "All Categories" || selectedCategory === ""
                ? true
                : post.category === selectedCategory
            )
            .map((post) => (
              <div
                key={post.id}
                className="card w-full shadow-xl mb-10 bg-[#641AE6]"
              >
                <div className="card-body">
                  {isAdmin && (
                    <span className="absolute top-0 right-0 m-2">
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="btn bg-red-500 hover:bg-red-700 text-white font-bold rounded"
                        title="Delete Post"
                      >
                        <i className="fa fa-trash"></i>
                      </button>
                    </span>
                  )}
                  <h2 className="card-title text-zinc-50 text-l">
                    {post.title}
                  </h2>
                  <p className="text-xs">
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                  <span className="flex flex-row w-[20%]">
                    <p className="text-xs badge badge-warning font-bold mr-2">
                      <i className="fa-solid fa-person fa-spin"></i> &nbsp;
                      {post.username}
                    </p>
                    {post.role === "admin" && (
                      <p className="text-xs badge border-none badge-color-changing font-bold text-blue-100">
                        <i className="fa fa-check-circle"></i>
                        &nbsp;Admin
                      </p>
                    )}
                  </span>

                  <p className="text-xs badge badge-sm badge-success font-bold">
                    <i className="fa-solid fa-check"></i> &nbsp;
                    {post.category}
                  </p>
                  <hr className="my-2 border-t-2 border-zinc-50" />

                  <p className="text-zinc-50 whitespace-pre-wrap break-words">
                    <span className="flex justify-center mb-3">
                      {post.imageUrl &&
                        (() => {
                          const fileType = getFileType(post.imageUrl);
                          switch (fileType) {
                            case "image":
                              return (
                                <img
                                  src={`https://backendforum.ngrok.app${post.imageUrl}`}
                                  alt="Post"
                                  height="100"
                                  width="100"
                                  className="rounded-lg"
                                />
                              );
                            case "video":
                              return (
                                <video
                                  ref={(element) =>
                                    (videoRefs.current[post.id] = element)
                                  }
                                  data-video-id={post.id}
                                  src={`https://backendforum.ngrok.app${post.imageUrl}`}
                                  className="rounded-lg"
                                  controls
                                  playsInline
                                  muted
                                  // autoPlay={isVideoVisible} // Set autoplay conditionally
                                ></video>
                              );
                            case "pdf":
                              return (
                                <span>
                                  <embed
                                    src={`https://backendforum.ngrok.app${post.imageUrl}`}
                                    type="application/pdf"
                                    className="rounded-lg w-full h-[500px]" // Tailwind CSS class for height
                                  />
                                  <button
                                    className="btn mt-2 bg-[#4a00b0] text-xs"
                                    onClick={() =>
                                      window.open(
                                        `https://backendforum.ngrok.app${post.imageUrl}`,
                                        "_blank"
                                      )
                                    }
                                  >
                                    Download {post.imageUrl.split("/").pop()}{" "}
                                    {/* Simplified file name extraction */}
                                  </button>
                                </span>
                              );
                            case "audio":
                              return (
                                <div className="audio-player flex flex-row items-center justify-center bg-gray-800 p-3 rounded-lg shadow-lg w-full">
                                  <i className="fa fa-music rounded-full text-xl color-changing"></i>

                                  <div className="flex flex-col mx-3">
                                    <span className="text-sm text-white font-semibold"></span>
                                  </div>
                                  <audio
                                    controls
                                    src={`https://backendforum.ngrok.app${post.imageUrl}`}
                                    className="w-full"
                                  >
                                    Your browser does not support the audio
                                    element.
                                  </audio>
                                </div>
                              );

                            default:
                              return (
                                <button
                                  type="button"
                                  className="btn btn-primary mt-2 bg-[#4a00b0] text-xs"
                                >
                                  <a
                                    href={`https://backendforum.ngrok.app${post.imageUrl}`}
                                    download
                                  >
                                    Download File{" "}
                                    {post.imageUrl.replace(
                                      "/uploads/image-",
                                      ""
                                    )}
                                  </a>
                                </button>
                              );
                          }
                        })()}
                    </span>

                    {post.content}
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="btn w-[30%] btn-primary mt-2 bg-[#4a00b0]"
                      disabled={isLiking[post.id]}
                    >
                      {likes[post.id] || 0}
                      <i
                        className="fa fa-heart text-red-500"
                        aria-hidden="true"
                      ></i>
                    </button>

                    <button
                      onClick={() => handleShowComments(post.id)}
                      className="btn w-[30%] btn-primary mt-2 bg-[#4a00b0] text-xs "
                    >
                      {showComments[post.id] ? "Hide" : "Show"} Comments
                    </button>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/post/${post.id}`;
                        navigator.clipboard.writeText(link).then(() => {
                          alert("Share link copied to clipboard!");
                        });
                      }}
                      className="btn w-[30%] btn-primary mt-2 bg-[#4a00b0] text-xs "
                    >
                      Share
                    </button>
                  </div>

                  {showComments[post.id] && (
                    <div className="flex flex-col ">
                      <textarea
                        type="text"
                        className="w-full h-16 rounded-lg focus:outline-none focus:border-blue-500 p-2 mr-2 resize-none"
                        placeholder={
                          isMuted == "muted"
                            ? "You are muted and cannot comment"
                            : "Write a comment..."
                        }
                        value={newComment[post.id] || ""}
                        disabled={isMuted == "muted" ? true:false}
                        onChange={(e) =>
                          setNewComment({
                            ...newComment,
                            [post.id]: e.target.value,
                          })
                        }
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="btn mb-4 mt-2"
                        disabled={isCommenting[post.id] || isMuted == "muted"? true:false}
                      >
                        Add Comment
                      </button>

                      {comments[post.id] &&
                        comments[post.id].map((comment, index) => (
                          <div
                            key={index}
                            className="whitespace-pre-wrap rounded-lg border border-[#191e24] p-3 mb-2 "
                          >
                            <span className="flex flex-col text-sm ">
                              <span>
                                <strong>{comment.username}</strong>{" "}
                                <span className="text-xs">
                                  {new Date(comment.timestamp).toLocaleString()}
                                </span>
                              </span>

                              {comment.comment}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default DashboardBody;
