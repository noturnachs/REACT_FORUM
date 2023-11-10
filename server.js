import express from "express";
import mysql from "mysql2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";

dotenv.config();

const app = express();
app.use(cors());
const port = 3000;

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "login_app",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});
app.use(express.json());
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // The folder where images will be stored
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    ); // Naming convention for the files
  },
});

const upload = multer({ storage: storage });
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "Username, email, and password are required" });
  }

  if (!email.endsWith("@usc.edu.ph")) {
    return res
      .status(400)
      .json({ error: "Email must have the domain @usc.edu.ph" });
  }

  db.query(
    "SELECT * FROM users WHERE email = ? OR username = ?",
    [email, username],
    async (err, results) => {
      if (err) {
        console.error("Registration error:", err);
        return res.status(500).json({ error: "Registration failed" });
      }

      if (results.length > 0) {
        let errorMessage = "";

        if (results.some((user) => user.email === email)) {
          errorMessage = "Email already in use";
        }

        if (results.some((user) => user.username === username)) {
          if (errorMessage !== "") {
            errorMessage += " and ";
          }
          errorMessage += "Username already in use";
        }

        return res.status(400).json({ error: errorMessage });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hashedPassword],
        (err, result) => {
          if (err) {
            console.error("Registration error:", err);
            res.status(500).json({ error: "Registration failed" });
          } else {
            console.log("User registered:", result);
            res.status(201).json({ message: "Registration successful" });
          }
        }
      );
    }
  );
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, results) => {
      if (err) {
        res.status(500).json({ error: "Login failed" });
      } else if (results.length === 0) {
        res.status(401).json({ error: "Invalid username or password" });
      } else {
        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
          const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
          );
          res.status(200).json({ message: "Login successful", token });
        } else {
          res.status(401).json({ error: "Invalid username or password" });
        }
      }
    }
  );
});

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      const message =
        err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
      return res.status(403).json({ error: message });
    }

    console.log("Authenticated user:", user);

    req.user = user;
    next();
  });
};

app.post("/api/posts/:postId/like", authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.id;

  db.query(
    "SELECT * FROM likes WHERE postId = ? AND userId = ?",
    [postId, userId],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: "Error checking existing like" });
      } else if (results.length > 0) {
        res.status(400).json({ error: "Post already liked" });
      } else {
        db.query(
          "INSERT INTO likes (postId, userId) VALUES (?, ?)",
          [postId, userId],
          (err, result) => {
            if (err) {
              res.status(500).json({ error: "Error liking post" });
            } else {
              res.status(200).json({ message: "Post liked successfully" });
            }
          }
        );
      }
    }
  );
});

app.get("/api/posts/:postId/userLikes", authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.id;

  db.query(
    "SELECT COUNT(*) AS count FROM likes WHERE postId = ? AND userId = ?",
    [postId, userId],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: "Error checking like status" });
      } else {
        // If count is greater than 0, it means the user has liked the post
        res.status(200).json({ liked: results[0].count > 0 });
      }
    }
  );
});

app.get("/api/posts/:postId/likesCount", (req, res) => {
  const postId = req.params.postId;

  db.query(
    "SELECT COUNT(*) AS count FROM likes WHERE postId = ?",
    [postId],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: "Error fetching likes count" });
      } else {
        res.status(200).json({ count: results[0].count });
      }
    }
  );
});

app.delete("/api/posts/:postId/unlike", authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.id;

  db.query(
    "DELETE FROM likes WHERE postId = ? AND userId = ?",
    [postId, userId],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: "Error unliking post" });
      } else {
        res.status(200).json({ message: "Post unliked successfully" });
      }
    }
  );
});

app.post("/api/posts/:postId/comment", authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.id;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  db.query(
    "INSERT INTO comments (postId, userId, comment) VALUES (?, ?, ?)",
    [postId, userId, comment],
    (err, result) => {
      if (err) {
        console.error("Error adding comment:", err);
        res.status(500).json({ error: "Error adding comment" });
      } else {
        res.status(201).json({ message: "Comment added successfully" });
      }
    }
  );
});
app.get("/api/posts/all", (req, res) => {
  db.query(
    "SELECT posts.id, posts.title, posts.content, posts.timestamp, posts.image_url, users.username, posts.category FROM posts JOIN users ON posts.userId = users.id ORDER BY posts.timestamp DESC",
    (err, results) => {
      if (err) {
        console.error("Error fetching posts:", err);
        return res.status(500).json({ error: "Error fetching posts" });
      }

      const posts = results.map((post) => {
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          createdAt: post.timestamp,
          imageUrl: post.image_url, // Add this line to include image_url
          username: post.username,
          category: post.category,
        };
      });

      res.json(posts);
    }
  );
});

app.get("/api/posts/:id", (req, res) => {
  const postId = req.params.id;

  db.query(
    "SELECT posts.*, users.username FROM posts JOIN users ON posts.userId = users.id WHERE posts.id = ?",
    [postId],
    (err, results) => {
      if (err) {
        console.error("Error fetching post:", err);
        return res.status(500).json({ error: "Error fetching post" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      const post = results[0];
      res.json({
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.timestamp,
        imageUrl: post.image_url,
        username: post.username,
        category: post.category,
      });
    }
  );
});

app.get("/api/posts/:postId/comments", (req, res) => {
  const postId = req.params.postId;

  db.query(
    `SELECT comments.*, users.username 
     FROM comments 
     JOIN users ON comments.userId = users.id 
     WHERE postId = ?`,
    [postId],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: "Error fetching comments" });
      } else {
        res.status(200).json(results);
      }
    }
  );
});

app.post(
  "/api/posts/create",
  authenticateToken,
  upload.single("image"),
  (req, res) => {
    const { content, title, category } = req.body;
    const image = req.file;
    if (!content || !title) {
      return res
        .status(400)
        .json({ error: "Title and content are required for the post" });
    }

    const imageUrl = image ? `/uploads/${image.filename}` : null;
    const userId = req.user.id;

    db.query(
      "INSERT INTO posts (userId, title, content, timestamp, category, image_url) VALUES (?, ?, ?, NOW(), ?, ?)",
      [userId, title, content, category, imageUrl],
      (err, result) => {
        if (err) {
          console.error("Post creation error:", err);
          res.status(500).json({ error: "Post creation failed" });
        } else {
          console.log("Post created:", result);
          res.status(201).json({ message: "Post created successfully" });
        }
      }
    );
  }
);

app.use("/uploads", express.static("uploads"));

// app.get("/api/posts/all", (req, res) => {
//   db.query(
//     "SELECT posts.id, posts.title, posts.content, posts.timestamp, users.username, posts.category FROM posts JOIN users ON posts.userId = users.id ORDER BY posts.timestamp DESC",
//     (err, results) => {
//       if (err) {
//         console.error("Error fetching posts:", err);
//         return res.status(500).json({ error: "Error fetching posts" });
//       }

//       const posts = results.map((post) => {
//         return {
//           id: post.id,
//           title: post.title,
//           content: post.content,
//           createdAt: post.timestamp,
//           username: post.username,
//           category: post.category,
//         };
//       });

//       res.json(posts);
//     }
//   );
// });

app.post("/api/users/findUserId", authenticateToken, (req, res) => {
  const { username } = req.body;

  db.query(
    "SELECT id FROM users WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error("Error finding user:", err);
        res.status(500).json({ error: "Error finding user" });
      } else if (results.length === 0) {
        res.status(404).json({ error: "User not found" });
      } else {
        const userId = results[0].id;
        res.json({ userId });
      }
    }
  );
});

app.get("/dashboard", authenticateToken, (req, res) => {
  const user = req.user;
  res.send(`Welcome to the dashboard, ${user.username}!`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
