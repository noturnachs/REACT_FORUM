import React, { useState, useEffect } from "react";
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
  // const [selectedCategory, setSelectedCategory] = useState("");

  const fetchPosts = () => {
    fetch("https://backendforum.ngrok.app/api/posts/all")
      .then((response) => response.json())
      .then((data) => setPosts(data))
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
      // console.log("Title:", newPostTitle);
      // console.log("Content:", newPostContent);
      // console.log("Category:", newPostCategory);
      return;
    }

    setIsPosting(true);
    const username = user.username;

    try {
      const res1 = await fetch(
        "https://backendforum.ngrok.app/api/users/findUserId",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              userId,
              username,
              title: newPostTitle,
              content: newPostContent,
              category: newPostCategory,
            }),
          }
        );
        const data2 = await res2.json();

        setNewPostTitle("");
        setNewPostContent("");
        setNewPostCategory("");
        fetchPosts();
      } else {
        console.error("User not found");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto p-2 mt-10">
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
            className="input input-primary w-full"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
          />
          <textarea
            rows="4"
            placeholder="What's on your mind?"
            className="textarea textarea-primary w-full resize-none h-24 mt-2"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          ></textarea>
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
                <p className="text-xs badge badge-sm badge-warning font-bold">
                  <i className="fa-solid fa-person fa-spin"></i> &nbsp;
                  {post.username}
                </p>
                <p className="text-xs badge badge-sm badge-success font-bold">
                  <i className="fa-solid fa-check"></i> &nbsp;
                  {post.category}
                </p>
                <hr className="my-2 border-t-2 border-zinc-50" />
                <p className="text-zinc-50">{post.content}</p>
                <p className="text-xs">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default DashboardBody;
