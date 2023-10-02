// CREATE DATABASE login_app;

// USE login_app;

// CREATE TABLE `users` (
//   `id` int(11) NOT NULL AUTO_INCREMENT,
//   `username` varchar(255) NOT NULL,
//   `email` varchar(255) NOT NULL,
//   `password` varchar(255) NOT NULL,
//   PRIMARY KEY (`id`)
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

// Registration endpoint
// Registration endpoint
app.post("/api/register", async (req, res) => {
  console.log("Received:", req.body);
  const { username, email, password } = req.body;

  // Check if any of the required fields are empty
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "Username, email, and password are required" });
  }

  // Check if the email has the required domain
  if (!email.endsWith("@usc.edu.ph")) {
    return res.status(400).json({ error: "Email must have the domain @usc.edu.ph" });
  }

  // Check if the email or username already exists in the database
  db.query(
    "SELECT * FROM users WHERE email = ? OR username = ?",
    [email, username],
    async (err, results) => {
      if (err) {
        console.error("Registration error:", err);
        return res.status(500).json({ error: "Registration failed" });
      }

      if (results.length > 0) {
        // User with the same email or username already exists
        return res
          .status(400)
          .json({ error: "Email or username already in use" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the user into the database with username, email, and password
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


// Login endpoint (accepts only username)
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body; // Change to "username"

  // Check if the username exists
  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, results) => {
      if (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Login failed" });
      } else if (results.length === 0) {
        res.status(401).json({ error: "Invalid username or password" });
      } else {
        const user = results[0];
        // Compare the hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
          // Password matches, so login is successful
          const token = jwt.sign(
            { username: user.username },
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

    req.user = user; // Attach user information to the request object
    next();
  });
};

// Use the middleware to protect routes that require authentication
app.get("/dashboard", authenticateToken, (req, res) => {
  const user = req.user; // Access user information from the request object
  res.send(`Welcome to the dashboard, ${user.username}!`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
