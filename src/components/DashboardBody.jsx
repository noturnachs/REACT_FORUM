import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";

const DashboardBody = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [posts, setPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState(""); // State to hold the new post title
  const [newPostContent, setNewPostContent] = useState(""); // State to hold the new post content

  useEffect(() => {
    // Get the JWT token from localStorage
    const token = localStorage.getItem("token");

    if (token) {
      // Decode the JWT token to access user information
      const decodedToken = jwt_decode(token);
      setUser(decodedToken); // Set the user information in the state

      // Log the userId
      console.log("User ID:", decodedToken.id);
    } else {
      // Handle the case where the token is not present (user not authenticated)
      navigate("/api/login");
    }

    // Fetch posts from the backend API
    fetch("http://localhost:3000/api/posts/all")
      .then((response) => response.json())
      .then((data) => setPosts(data))
      .catch((error) => console.error("Error fetching posts:", error));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/api/login");
  };

  // Function to handle posting a new content
  // Function to handle posting a new content
  const handlePost = async () => {
    if (!newPostTitle || !newPostContent) {
      alert("Please enter title and content for the new post.");
      return;
    }

    const username = user.username;

    try {
      const res1 = await fetch("http://localhost:3000/api/users/findUserId", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ username }),
      });
      const data1 = await res1.json();

      if (data1.userId) {
        const userId = data1.userId;

        const res2 = await fetch("http://localhost:3000/api/posts/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            userId,
            title: newPostTitle,
            content: newPostContent,
          }),
        });
        const data2 = await res2.json();

        setNewPostTitle("");
        setNewPostContent("");
        fetchPosts();
      } else {
        console.error("User not found");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Function to fetch the updated posts
  const fetchPosts = () => {
    fetch("http://localhost:3000/api/posts/all")
      .then((response) => response.json())
      .then((data) => setPosts(data))
      .catch((error) => console.error("Error fetching posts:", error));
  };

  return (
    <>
      <div className="max-w-md mx-auto p-2 mt-10">
        {/* Area to post new content */}
        <div className="mb-10 form-control">
          <input
            type="text"
            placeholder="Title"
            className="input input-primary w-full"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
          />
          <textarea
            rows="4"
            placeholder="Whats on your mind?"
            className="textarea textarea-primary w-full resize-none h-24 mt-2"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          ></textarea>
          <button onClick={handlePost} className="btn btn-primary mt-2">
            Post
          </button>
        </div>

        {/* Display existing posts */}
        {posts.map((post) => (
          <div
            key={post.id}
            className="card w-full shadow-xl mb-10 bg-[#641AE6]"
          >
            {/* <figure>
              <img
                src="https://wallpapers.com/images/hd/animated-disney-castle-has6vy47k75d0bzs.jpg"
                alt="Disney"
              />
            </figure> */}
            <div className="card-body ">
              <h2 className="card-title text-zinc-50 text-l">{post.title}</h2>
              <hr className="my-2 border-t-2 border-zinc-50" />
              <p className="text-zinc-50">{post.content}</p>
              <p className="text-xs ">
                {new Date(post.createdAt).toLocaleString()}
              </p>{" "}
              {/* Display the time */}
              <div className="card-actions justify-end">
                {/* <a href={post.link} target="_blank" className="btn btn-primary">
                  Read More
                </a> */}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default DashboardBody;
