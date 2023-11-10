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

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height to auto
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scrollHeight
    }
  };

  const fetchPosts = () => {
    fetch("https://backendforum.ngrok.app/api/posts/all")
      .then((response) => response.json())
      .then(async (postsData) => {
        setPosts(postsData);
        const initialLikes = {};
        const initialUserLikes = {};

        await Promise.all(
          postsData.map(async (post) => {
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
    if (token) {
      const decodedToken = jwt_decode(token);
      setUser(decodedToken);
    } else {
      navigate("/api/login");
    }

    fetchPosts();

    const intervalId = setInterval(fetchPosts, 5000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/api/login");
  };

  const handleLike = async (postId) => {
    setIsLiking((prev) => ({ ...prev, [postId]: true }));
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
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

      const res1 = await fetch(
        "https://backendforum.ngrok.app/api/users/findUserId",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username }),
        }
      );
      const data1 = await res1.json();

      if (data1.userId) {
        const userId = data1.userId;

        const res2 = await fetch(
          "https://backendforum.ngrok.app/api/posts/create",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );
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

  return (
    <>
      <div className="max-w-md mx-auto p-2 mt-10 ">
        <div className="mb-10 form-control">
          <select
            className="input input-primary w-full mb-2"
            value={newPostCategory}
            onChange={(e) => setNewPostCategory(e.target.value)}
          >
            <option value="">Select a category</option>
            <option value="School of Arts and Sciences">
              School of Arts and Sciences
            </option>
            <option value="School of Engineering">School of Engineering</option>
            <option value="School of Architecture, Fine Arts and Design">
              School of Architecture, Fine Arts and Design
            </option>
            <option value="School of Business and Economics">
              School of Business and Economics
            </option>
            <option value="School of Education">School of Education</option>
            <option value="School of Healthcare Professions">
              School of Healthcare Professions
            </option>
            <option value="School of Law and Governance">
              School of Law and Governance
            </option>
            <option value="Trashtalks">Trashtalks</option>
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
            placeholder="What's on your mind?"
            className="w-full h-16 rounded-lg focus:outline-none focus:border-blue-500 p-2 mr-2 resize-none"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            onInput={adjustHeight}
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
                accept="image/*,application/pdf,text/plain"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </label>
          </div>

          <button
            onClick={handlePost}
            className={`btn btn-primary mt-2 ${
              isPosting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isPosting}
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
                <h2 className="card-title text-zinc-50 text-l">{post.title}</h2>
                <p className="text-xs">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
                <p className="text-xs badge badge-sm badge-warning font-bold">
                  <i className="fa-solid fa-person fa-spin"></i> &nbsp;
                  {post.username}
                </p>
                <p className="text-xs badge badge-sm badge-success font-bold">
                  <i className="fa-solid fa-check"></i> &nbsp;
                  {post.category}
                </p>
                <hr className="my-2 border-t-2 border-zinc-50" />

                <p className="text-zinc-50 whitespace-pre-wrap break-words">
                  <span className="flex justify-center">
                    {post.imageUrl && (
                      <img
                        src={`https://backendforum.ngrok.app${post.imageUrl}`} // Adjust the domain as necessary
                        alt="Post"
                        className="rounded-lg "
                      />
                    )}
                  </span>

                  {post.content}
                </p>
                <div className="flex">
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
                      placeholder="Write a comment..."
                      value={newComment[post.id] || ""}
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
                      disabled={isCommenting[post.id]}
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
                            <strong>{comment.username}</strong>
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
    </>
  );
};

export default DashboardBody;
