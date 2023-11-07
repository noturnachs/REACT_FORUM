import express from "express";
import mysql from "mysql2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

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
      return res.status(403).json({ error: "Invalid token" });
    }

    console.log("Authenticated user:", user);

    req.user = user;
    next();
  });
};

app.post("/api/posts/create", authenticateToken, (req, res) => {
  const { content, title } = req.body; 

  if (!content || !title) {
    return res
      .status(400)
      .json({ error: "Title and content are required for the post" });
  }

  const userId = req.user.id; 

  db.query(
    "INSERT INTO posts (userId, title, content, timestamp) VALUES (?, ?, ?, NOW())",
    [userId, title, content],
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
});

app.get("/api/posts/all", (req, res) => {
  db.query(
    "SELECT posts.id, posts.title, posts.content, posts.timestamp, users.username FROM posts JOIN users ON posts.userId = users.id ORDER BY posts.timestamp DESC",
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
          username: post.username, 
        };
      });

      res.json(posts);
    }
  );
});


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
