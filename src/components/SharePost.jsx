// SinglePost.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import { isTokenExpired } from "../utils/authUtils";

const SinglePost = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMuted, setIsMuted] = useState(null);
  const videoRef = useRef(null);
  const [announcement, setAnnouncement] = useState("");



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
      setIsAdmin(decodedToken.role === "admin");
      setIsMuted(decodedToken.status === "muted" ? "muted" : "none");
    } else {
      navigate("/api/login");
    }

    fetchPosts();

    const intervalId = setInterval(fetchPosts, 5000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  useEffect(() => {
    // Fetch the post by ID
    fetch(`https://backendforum.ngrok.app/api/posts/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setPost(data);
  
        // Setup Intersection Observer for the video after the post is loaded
        const handleIntersection = (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && videoRef.current) {
              videoRef.current.play();
            } else if (videoRef.current) {
              videoRef.current.pause();
            }
          });
        };
  
        const observer = new IntersectionObserver(handleIntersection);
        if (videoRef.current) {
          observer.observe(videoRef.current);
        }
  
        // Clean up
        return () => {
          if (videoRef.current) {
            observer.unobserve(videoRef.current);
          }
        };
      })
      .catch((error) => console.error("Error fetching post:", error));
  }, [id]);
  

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
        fetch(`https://backendforum.ngrok.app/api/posts/${postId}/likesCount`)
          .then((response) => response.json())
          .then((data) => {
            setLikes((prevLikes) => ({
              ...prevLikes,
              [postId]: data.count,
            }));
          })
          .catch((error) =>
            console.error("Error fetching updated likes count:", error)
          );
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

  const goHome = () => {
    navigate("/dashboard");
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

  useEffect(() => {

    fetch("https://backendforum.ngrok.app/api/announcements/latest")
    .then(response => response.json())
    .then(data => {
      if (data && data.message) {
        setAnnouncement(data.message);
      }
    })
    .catch(error => console.error("Error fetching announcement:", error));

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      });
    };
  
    const observer = new IntersectionObserver(handleIntersection);
    if (videoRef.current) {
      observer.observe(videoRef.current);
    }
  
    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);
  

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
            navigate("/dashboard");
          } else {
            throw new Error("Failed to delete post");
          }
        })
        .catch((error) => {
          console.error("Error deleting post:", error);
        });
    }
  };

  if (!post) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="max-w-md mx-auto p-2 mt-10">
      {announcement && (
  <div className="flex justify-center items-center">
    <button className="btn btn-error mb-5 w-full">
      {announcement}
    </button>
  </div>
)}
        <div key={post.id} className="card w-full shadow-xl mb-10 bg-[#641AE6]">
          
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
            <h2 className="card-title text-zinc-50 text-l">{post.title}</h2>
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
                            className="rounded-lg"
                          />
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
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        );
                        case "video":
                          return (
                            <video
                              ref={videoRef}
                              data-video-id={post.id}
                              src={`https://backendforum.ngrok.app${post.imageUrl}`}
                              className="rounded-lg"
                              controls
                              playsInline
                              muted
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
                              {post.imageUrl.replace("/uploads/image-", "")}
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
                <i className="fa fa-heart text-red-500" aria-hidden="true"></i>
              </button>

              <button
                onClick={() => handleShowComments(post.id)}
                className="btn w-[30%] btn-primary mt-2 bg-[#4a00b0] text-xs "
              >
                {showComments[post.id] ? "Hide" : "Show"} Comments
              </button>

              <button
                type="button"
                className="btn w-[30%] btn-primary mt-2 bg-[#4a00b0] text-xs "
                onClick={goHome}
              >
                Home
              </button>
            </div>

            {showComments[post.id] && (
              <div className="flex flex-col ">
                <textarea
                  type="text"
                  className="w-full h-16 rounded-lg focus:outline-none focus:border-blue-500 p-2 mr-2 resize-none"
                  placeholder={
                    isMuted === "muted"
                      ? "You are muted and cannot comment"
                      : "Write a comment..."
                  }
                  value={newComment[post.id] || ""}
                  disabled={isMuted === "muted"}
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
                  disabled={isCommenting[post.id] || isMuted === "muted"}
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
      </div>
    </>
  );
};

export default SinglePost;
