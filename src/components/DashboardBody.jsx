import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";

const DashboardBody = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [posts, setPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const fetchPosts = () => {
    fetch("http://localhost:3000/api/posts/all")
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
    if (!newPostTitle || !newPostContent) {
      alert("Please enter title and content for the new post.");
      return;
    }

    setIsPosting(true);
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
            username,
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
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto p-2 mt-10">
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

        {posts.map((post) => (
          <div
            key={post.id}
            className="card w-full shadow-xl mb-10 bg-[#641AE6]"
          >
            <div className="card-body">
              <h2 className="card-title text-zinc-50 text-l">{post.title}</h2>
              <p className="text-xs badge badge-sm badge-warning font-bold">
                {post.username}
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
