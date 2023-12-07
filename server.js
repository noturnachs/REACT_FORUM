import express from "express";
import mysql from "mysql2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import heicConvert from "heic-convert";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
const port = 3000;
let db;

let pool;

const establishConnection = () => {
  pool = mysql.createPool({
    connectionLimit: 100, // Adjust the limit as per your requirements
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error connecting to the database:", err);
      setTimeout(establishConnection, 2000); // Try to reconnect every 2 seconds
    } else {
      connection.release();
      console.log("Connected to the database");
    }
  });

  pool.on("error", (err) => {
    console.error("Database error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      establishConnection(); // Reconnect if the connection is lost
    } else {
      throw err;
    }
  });
};

establishConnection();

app.use(express.json());
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/uploads/"); // The folder where images will be stored
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
  const { username, email, password, firstname, lastname, program, yearlevel } =
    req.body;

  if (
    !username ||
    !email ||
    !password ||
    !firstname ||
    !lastname ||
    !program ||
    !yearlevel
  ) {
    return res.status(400).json({ error: "Fill in the required fields." });
  }

  if (!email.endsWith("@usc.edu.ph")) {
    return res
      .status(400)
      .json({ error: "Email must have the domain @usc.edu.ph" });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username],
      async (err, results) => {
        if (err) {
          console.error("Registration error:", err);
          connection.release();
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

          connection.release();
          return res.status(400).json({ error: errorMessage });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        connection.query(
          "INSERT INTO users (username, email, password, firstname, lastname, program, yearlevel) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            username,
            email,
            hashedPassword,
            firstname,
            lastname,
            program,
            yearlevel,
          ],
          (err, result) => {
            connection.release();
            if (err) {
              console.error("Registration error:", err);
              return res.status(500).json({ error: "Registration failed" });
            }
            console.log("User registered:", result);
            return res.status(201).json({ message: "Registration successful" });
          }
        );
      }
    );
  });
});

app.post("/api/place-order", async (req, res) => {
  const orderData = req.body;
  // You may want to add validation for the orderData here

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error("Transaction begin error:", err);
        return res.status(500).json({ error: "Transaction begin failed" });
      }

      connection.query(
        "INSERT INTO orders (userId, email, fullName, course, year, total) VALUES (?, ?, ?, ?, ?, ?)",
        [
          orderData.userId,
          orderData.email,
          orderData.fullName,
          orderData.program,
          orderData.yearLevel,
          orderData.total,
        ],
        (err, result) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Order insertion error:", err);
              return res.status(500).json({ error: "Order insertion failed" });
            });
          }

          const orderId = result.insertId;

          const orderItems = orderData.cart.map((item) => [
            orderId,
            item.id,
            item.quantity,
          ]);

          connection.query(
            "INSERT INTO order_items (orderId, productId, quantity) VALUES ?",
            [orderItems],
            (err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("Order items insertion error:", err);
                  return res
                    .status(500)
                    .json({ error: "Order items insertion failed" });
                });
              }

              connection.commit((err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error("Transaction commit error:", err);
                    return res
                      .status(500)
                      .json({ error: "Transaction commit failed" });
                  });
                }

                connection.release();
                console.log("Order placed successfully");
                return res
                  .status(200)
                  .json({ message: "Order placed successfully" });
              });
            }
          );
        }
      );
    });
  });
});

app.put("/api/update-email/:userID", async (req, res) => {
  const userID = req.params.userID;
  const newEmail = req.body.newEmail;

  // Validate the email address if needed
  if (!newEmail || !newEmail.endsWith("@usc.edu.ph")) {
    return res.status(400).json({ error: "Invalid or missing email format" });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "UPDATE users SET email = ? WHERE id = ?",
      [newEmail, userID],
      (err, result) => {
        connection.release();
        if (err) {
          console.error("Email update error:", err);
          return res.status(500).json({ error: "Email update failed" });
        }
        console.log("Email updated for user with ID:", userID);
        return res.status(200).json({ message: "Email updated successfully" });
      }
    );
  });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
      async (err, results) => {
        connection.release();
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        } else if (results.length === 0) {
          return res
            .status(401)
            .json({ error: "Invalid username or password" });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
          const token = jwt.sign(
            {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              status: user.status,
              firstname: user.firstname,
              lastname: user.lastname,
              program: user.program,
              yearlevel: user.yearlevel,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
          );
          return res.status(200).json({ message: "Login successful", token });
        } else {
          return res
            .status(401)
            .json({ error: "Invalid username or password" });
        }
      }
    );
  });
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

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "SELECT * FROM likes WHERE postId = ? AND userId = ?",
      [postId, userId],
      (err, results) => {
        if (err) {
          connection.release();
          return res
            .status(500)
            .json({ error: "Error checking existing like" });
        } else if (results.length > 0) {
          connection.release();
          return res.status(400).json({ error: "Post already liked" });
        } else {
          connection.query(
            "INSERT INTO likes (postId, userId) VALUES (?, ?)",
            [postId, userId],
            (err, result) => {
              connection.release();
              if (err) {
                return res.status(500).json({ error: "Error liking post" });
              } else {
                return res
                  .status(200)
                  .json({ message: "Post liked successfully" });
              }
            }
          );
        }
      }
    );
  });
});

app.get("/api/posts/:postId/userLikes", authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.id;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "SELECT COUNT(*) AS count FROM likes WHERE postId = ? AND userId = ?",
      [postId, userId],
      (err, results) => {
        connection.release();
        if (err) {
          return res.status(500).json({ error: "Error checking like status" });
        }
        // If count is greater than 0, it means the user has liked the post
        return res.status(200).json({ liked: results[0].count > 0 });
      }
    );
  });
});

app.delete("/api/comments/:commentId/delete", authenticateToken, (req, res) => {
  const commentId = req.params.commentId;
  const userId = req.user.id;

  // Check if user is deleting their own comment or is an admin
  if (userId !== req.user.id && req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Unauthorized to delete this comment" });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "DELETE FROM comments WHERE id = ?",
      [commentId],
      (err, result) => {
        connection.release();
        if (err) {
          console.error("Error deleting comment:", err);
          return res.status(500).json({ error: "Error deleting comment" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Comment not found" });
        }

        return res
          .status(200)
          .json({ message: "Comment deleted successfully" });
      }
    );
  });
});

app.put("/api/users/updateStatus/:userId", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Unauthorized: Admin access required" });
  }

  if (req.user.username !== "dan") {
    return res.status(403).json({
      error: "Unauthorized: Only the specific admin can change user status",
    });
  }

  const userId = req.params.userId;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "UPDATE users SET status = ? WHERE id = ?",
      [status, userId],
      (err, result) => {
        connection.release();
        if (err) {
          console.error("Error updating user status:", err);
          return res.status(500).json({ error: "Error updating user status" });
        } else if (result.affectedRows === 0) {
          return res.status(404).json({ error: "User not found" });
        } else {
          return res.json({ message: "User status updated successfully" });
        }
      }
    );
  });
});

app.delete("/api/posts/delete/:postId", authenticateToken, (req, res) => {
  // Check if the user is an admin
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Unauthorized: Admin access required" });
  }

  const postId = req.params.postId;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "DELETE FROM posts WHERE id = ?",
      [postId],
      (err, result) => {
        connection.release();
        if (err) {
          console.error("Error deleting post:", err);
          return res.status(500).json({ error: "Error deleting post" });
        } else if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Post not found" });
        } else {
          console.log("Post deleted:", result);
          return res.status(200).json({ message: "Post deleted successfully" });
        }
      }
    );
  });
});

app.get("/api/posts/:postId/likesCount", (req, res) => {
  const postId = req.params.postId;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "SELECT COUNT(*) AS count FROM likes WHERE postId = ?",
      [postId],
      (err, results) => {
        connection.release();
        if (err) {
          return res.status(500).json({ error: "Error fetching likes count" });
        } else {
          return res.status(200).json({ count: results[0].count });
        }
      }
    );
  });
});

app.delete("/api/posts/:postId/unlike", authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.id;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "DELETE FROM likes WHERE postId = ? AND userId = ?",
      [postId, userId],
      (err, result) => {
        connection.release();
        if (err) {
          return res.status(500).json({ error: "Error unliking post" });
        } else {
          return res.status(200).json({ message: "Post unliked successfully" });
        }
      }
    );
  });
});

app.post("/api/categories/add", authenticateToken, (req, res) => {
  // Check if the user is an admin
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Unauthorized: Admin access required" });
  }

  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "INSERT INTO categories (name) VALUES (?)",
      [name],
      (err, result) => {
        connection.release();
        if (err) {
          console.error("Error adding category:", err);
          return res.status(500).json({ error: "Error adding category" });
        } else {
          return res.status(201).json({
            message: "Category added successfully",
            newCategoryId: result.insertId,
          });
        }
      }
    );
  });
});

app.delete("/api/categories/delete/:id", authenticateToken, (req, res) => {
  // Check if the user is an admin
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Unauthorized: Admin access required" });
  }

  const categoryId = req.params.id;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "DELETE FROM categories WHERE id = ?",
      [categoryId],
      (err, result) => {
        connection.release();
        if (err) {
          console.error("Error deleting category:", err);
          return res.status(500).json({ error: "Error deleting category" });
        } else {
          return res
            .status(200)
            .json({ message: "Category deleted successfully" });
        }
      }
    );
  });
});

app.post("/api/posts/:postId/comment", authenticateToken, (req, res) => {
  if (req.user.status === "muted") {
    return res.status(403).json({ error: "You are muted and cannot comment" });
  }

  const postId = req.params.postId;
  const userId = req.user.id;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "INSERT INTO comments (postId, userId, comment) VALUES (?, ?, ?)",
      [postId, userId, comment],
      (err, result) => {
        connection.release();
        if (err) {
          console.error("Error adding comment:", err);
          return res.status(500).json({ error: "Error adding comment" });
        } else {
          return res
            .status(201)
            .json({ message: "Comment added successfully" });
        }
      }
    );
  });
});

app.get("/api/posts/all", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "SELECT posts.id, posts.userId, posts.title, posts.content, posts.timestamp, posts.image_url, users.username, users.email, users.role, posts.category FROM posts JOIN users ON posts.userId = users.id ORDER BY posts.timestamp DESC",
      (err, results) => {
        connection.release();
        if (err) {
          console.error("Error fetching posts:", err);
          return res.status(500).json({ error: "Error fetching posts" });
        }

        const posts = results.map((post) => {
          return {
            id: post.id,
            userId: post.userId, // Include userId here
            title: post.title,
            content: post.content,
            createdAt: post.timestamp,
            imageUrl: post.image_url,
            username: post.username,
            email: post.email,
            role: post.role,
            category: post.category,
          };
        });

        res.json(posts);
      }
    );
  });
});

app.get("/api/products", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query("SELECT * FROM products", (err, results) => {
      connection.release();
      if (err) {
        console.error("Error fetching products:", err);
        return res.status(500).json({ error: "Error fetching products" });
      } else {
        return res.json(results);
      }
    });
  });
});

app.get("/api/users", authenticateToken, (req, res) => {
  // Check if the user is an admin
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Unauthorized: Admin access required" });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "SELECT id, username, email, role, status FROM users",
      (err, results) => {
        connection.release();
        if (err) {
          console.error("Error fetching users:", err);
          return res.status(500).json({ error: "Error fetching users" });
        } else {
          return res.json(results);
        }
      }
    );
  });
});

app.put("/api/users/updateRole/:userId", authenticateToken, (req, res) => {
  // Check if the user is an admin
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Unauthorized: Admin access required" });
  }

  if (req.user.username !== "dan") {
    return res.status(403).json({
      error: "Unauthorized: Only the specific admin can change user roles",
    });
  }

  const { role } = req.body;
  const userId = req.params.userId;

  if (!role) {
    return res.status(400).json({ error: "Role is required" });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, userId],
      (err, result) => {
        connection.release();
        if (err) {
          console.error("Error updating user role:", err);
          return res.status(500).json({ error: "Error updating user role" });
        } else if (result.affectedRows === 0) {
          return res.status(404).json({ error: "User not found" });
        } else {
          return res.json({ message: "User role updated successfully" });
        }
      }
    );
  });
});

app.get("/api/posts/:id", (req, res) => {
  const postId = req.params.id;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "SELECT posts.*, users.username, users.email, users.role, users.id AS userId FROM posts JOIN users ON posts.userId = users.id WHERE posts.id = ?",
      [postId],
      (err, results) => {
        connection.release();
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
          userId: post.userId, // Include userId here
          title: post.title,
          content: post.content,
          createdAt: post.timestamp,
          imageUrl: post.image_url,
          username: post.username,
          email: post.email,
          role: post.role,
          category: post.category,
        });
      }
    );
  });
});

app.get("/api/posts/:postId/comments", (req, res) => {
  const postId = req.params.postId;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      `SELECT comments.*, users.username, users.id AS userId 
       FROM comments  
       JOIN users ON comments.userId = users.id
       WHERE postId = ?`,
      [postId],
      (err, results) => {
        connection.release();
        if (err) {
          console.error("Error fetching comments:", err);
          return res.status(500).json({ error: "Error fetching comments" });
        } else {
          return res.status(200).json(results);
        }
      }
    );
  });
});

app.get("/api/users/:userId/profilePhoto", authenticateToken, (req, res) => {
  const userId = req.params.userId; // Get user ID from the URL parameter

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "SELECT profile_photo FROM users WHERE id = ?",
      [userId],
      (err, results) => {
        connection.release();
        if (err) {
          console.error("Error fetching user profile photo:", err);
          return res
            .status(500)
            .json({ error: "Error fetching profile photo" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const profilePhotoPath = results[0].profile_photo;
        if (profilePhotoPath) {
          return res.json({ profilePhotoPath });
        } else {
          return res.json({ profilePhotoPath: null }); // Handle case where user hasn't uploaded a photo
        }
      }
    );
  });
});

app.get("/api/users/profilePhoto", authenticateToken, (req, res) => {
  const userId = req.user.id; // Get user ID from authenticated token

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "SELECT profile_photo FROM users WHERE id = ?",
      [userId],
      (err, results) => {
        connection.release();
        if (err) {
          console.error("Error fetching user profile photo:", err);
          return res
            .status(500)
            .json({ error: "Error fetching profile photo" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const profilePhotoPath = results[0].profile_photo;
        if (profilePhotoPath) {
          return res.json({ profilePhotoPath });
        } else {
          return res.json({ profilePhotoPath: null }); // Handle case where user hasn't uploaded a photo
        }
      }
    );
  });
});

app.post(
  "/api/users/uploadProfilePhoto",
  authenticateToken,
  upload.single("profile_photo"),
  async (req, res) => {
    const userId = req.user.id;
    let profilePhotoPath = null;

    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Database connection error:", err);
        return res.status(500).json({ error: "Database connection failed" });
      }

      connection.beginTransaction(async (err) => {
        if (err) {
          connection.release();
          console.error("Transaction begin error:", err);
          return res.status(500).json({ error: "Error starting transaction" });
        }

        try {
          if (req.file) {
            const image = req.file;
            const ext = path.extname(image.originalname).toLowerCase();

            if (ext === ".heic" || ext === ".heif") {
              // Convert HEIC/HEIF to JPEG
              const inputBuffer = fs.readFileSync(image.path);
              const outputBuffer = await heicConvert({
                buffer: inputBuffer, // the HEIC file buffer
                format: "JPEG", // output format
                quality: 1, // the jpeg compression quality, between 0 and 1
              });

              // Save the converted image
              const newFilename = image.filename.replace(ext, ".jpg");
              fs.writeFileSync(
                path.join("/uploads", newFilename),
                outputBuffer
              );

              // Update profile photo path to point to the converted image
              profilePhotoPath = `/uploads/${newFilename}`;

              // Optionally, delete the original HEIC file
              fs.unlinkSync(image.path);
            } else {
              profilePhotoPath = `/uploads/${image.filename}`;
            }
          }

          if (profilePhotoPath) {
            connection.query(
              "UPDATE users SET profile_photo = ? WHERE id = ?",
              [profilePhotoPath, userId],
              (err, result) => {
                if (err) {
                  connection.rollback(() => {
                    connection.release();
                    console.error("Error updating user profile photo:", err);
                    return res
                      .status(500)
                      .json({ error: "Error updating profile photo" });
                  });
                }
                connection.commit((err) => {
                  if (err) {
                    connection.rollback(() => {
                      connection.release();
                      console.error("Error committing transaction:", err);
                      return res
                        .status(500)
                        .json({ error: "Error committing transaction" });
                    });
                  }
                  connection.release();
                  res.json({
                    message: "Profile photo updated successfully",
                    profilePhotoPath,
                  });
                });
              }
            );
          } else {
            connection.commit((err) => {
              if (err) {
                connection.rollback(() => {
                  connection.release();
                  console.error("Error committing transaction:", err);
                  return res
                    .status(500)
                    .json({ error: "Error committing transaction" });
                });
              }
              connection.release();
              res.status(400).json({ error: "No image file provided" });
            });
          }
        } catch (error) {
          connection.rollback(() => {
            connection.release();
            console.error("Error during image conversion:", error);
            return res
              .status(500)
              .json({ error: "Error processing image file" });
          });
        }
      });
    });
  }
);

app.post(
  "/api/posts/create",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    if (req.user.status === "muted") {
      return res.status(403).json({ error: "You are muted and cannot post" });
    }

    const { content, title, category } = req.body;
    let imageUrl = null;
    const userId = req.user.id;

    if (!content || !title) {
      return res
        .status(400)
        .json({ error: "Title and content are required for the post" });
    }

    if (req.file) {
      const image = req.file;
      const ext = path.extname(image.originalname).toLowerCase();

      if (ext === ".heic" || ext === ".heif") {
        try {
          // Convert HEIC/HEIF to JPEG
          const inputBuffer = fs.readFileSync(image.path);
          const outputBuffer = await heicConvert({
            buffer: inputBuffer, // the HEIC file buffer
            format: "JPEG", // output format
            quality: 1, // the jpeg compression quality, between 0 and 1
          });

          // Save the converted image
          const newFilename = image.filename.replace(ext, ".jpg");
          fs.writeFileSync(path.join("/uploads", newFilename), outputBuffer);

          // Update image URL to point to the converted image
          imageUrl = `/uploads/${newFilename}`;

          // Optionally, delete the original HEIC file
          fs.unlinkSync(image.path);
        } catch (error) {
          console.error("Error during image conversion:", error);
          return res.status(500).json({ error: "Error processing image file" });
        }
      } else {
        imageUrl = `/uploads/${image.filename}`;
      }
    }

    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Database connection error:", err);
        return res.status(500).json({ error: "Database connection failed" });
      }

      connection.query(
        "INSERT INTO posts (userId, title, content, timestamp, category, image_url) VALUES (?, ?, ?, NOW(), ?, ?)",
        [userId, title, content, category, imageUrl],
        (err, result) => {
          connection.release();
          if (err) {
            console.error("Post creation error:", err);
            return res.status(500).json({ error: "Post creation failed" });
          } else {
            console.log("Post created:", result);
            return res
              .status(201)
              .json({ message: "Post created successfully" });
          }
        }
      );
    });
  }
);

app.use("/uploads", express.static("/uploads"));

app.post("/api/users/findUserId", authenticateToken, (req, res) => {
  const { username } = req.body;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "SELECT id FROM users WHERE username = ?",
      [username],
      (err, results) => {
        connection.release();
        if (err) {
          console.error("Error finding user:", err);
          return res.status(500).json({ error: "Error finding user" });
        } else if (results.length === 0) {
          return res.status(404).json({ error: "User not found" });
        } else {
          const userId = results[0].id;
          return res.json({ userId });
        }
      }
    );
  });
});

app.get("/api/categories", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query("SELECT * FROM categories", (err, results) => {
      connection.release();
      if (err) {
        console.error("Error fetching categories:", err);
        return res.status(500).json({ error: "Error fetching categories" });
      }
      return res.json(results);
    });
  });
});

app.post("/api/announcements/create", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Unauthorized: Admin access required" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "INSERT INTO announcements (message, timestamp) VALUES (?, NOW())",
      [message],
      (err, result) => {
        connection.release();
        if (err) {
          console.error("Error creating announcement:", err);
          return res.status(500).json({ error: "Error creating announcement" });
        } else {
          return res
            .status(201)
            .json({ message: "Announcement created successfully" });
        }
      }
    );
  });
});

app.get("/api/announcements/latest", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query(
      "SELECT * FROM announcements ORDER BY timestamp DESC LIMIT 1",
      (err, results) => {
        connection.release();
        if (err) {
          console.error("Error fetching announcement:", err);
          return res.status(500).json({ error: "Error fetching announcement" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "No announcements found" });
        } else {
          return res.json(results[0]);
        }
      }
    );
  });
});

// Endpoint to get orders and order items for a specific user
app.get("/api/orders/:userId", (req, res) => {
  const userId = req.params.userId;

  // Use the connection pool to query the database
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: " + err.message);
      res.status(500).send("Internal Server Error");
      return;
    }

    // Query to get orders for the specified user
    const ordersQuery =
      "SELECT * FROM orders WHERE userId = ? ORDER BY timestamp DESC";

    connection.query(
      ordersQuery,
      [userId],
      (ordersQueryError, ordersResults) => {
        if (ordersQueryError) {
          console.error(
            "Error querying orders table: " + ordersQueryError.message
          );
          res.status(500).send("Internal Server Error");
          return;
        }

        // Query to get order items for the orders
        const orderItemsQuery =
          "SELECT * FROM order_items WHERE orderId IN (?)";

        const orderIds = ordersResults.map((order) => order.id);

        connection.query(
          orderItemsQuery,
          [orderIds],
          (orderItemsQueryError, orderItemsResults) => {
            if (orderItemsQueryError) {
              console.error(
                "Error querying order_items table: " +
                  orderItemsQueryError.message
              );
              res.status(500).send("Internal Server Error");
              return;
            }

            // Query to get product details for each order item
            const productIds = orderItemsResults.map((item) => item.productId);
            const productsQuery = "SELECT * FROM products WHERE id IN (?)";

            connection.query(
              productsQuery,
              [productIds],
              (productsQueryError, productsResults) => {
                // Release the connection back to the pool
                connection.release();

                if (productsQueryError) {
                  console.error(
                    "Error querying products table: " +
                      productsQueryError.message
                  );
                  res.status(500).send("Internal Server Error");
                  return;
                }

                // Combine orders, order items, and product details
                const ordersWithItems = ordersResults.map((order) => {
                  const itemsForOrder = orderItemsResults
                    .filter((item) => item.orderId === order.id)
                    .map((item) => {
                      const product = productsResults.find(
                        (product) => product.id === item.productId
                      );
                      return { ...item, product };
                    });

                  return { ...order, items: itemsForOrder };
                });

                // Send the combined results as JSON
                res.json(ordersWithItems);
              }
            );
          }
        );
      }
    );
  });
});

app.get("/api/order/all", (req, res) => {
  // Use the connection pool to query the database
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: " + err.message);
      res.status(500).send("Internal Server Error");
      return;
    }

    // Query to get all orders
    const ordersQuery = "SELECT * FROM orders ORDER BY timestamp DESC";

    connection.query(ordersQuery, (ordersQueryError, ordersResults) => {
      if (ordersQueryError) {
        console.error(
          "Error querying orders table: " + ordersQueryError.message
        );
        res.status(500).send("Internal Server Error");
        return;
      }

      // Query to get order items for all orders
      const orderIds = ordersResults.map((order) => order.id);
      const orderItemsQuery = "SELECT * FROM order_items WHERE orderId IN (?)";

      connection.query(
        orderItemsQuery,
        [orderIds],
        (orderItemsQueryError, orderItemsResults) => {
          if (orderItemsQueryError) {
            console.error(
              "Error querying order_items table: " +
                orderItemsQueryError.message
            );
            res.status(500).send("Internal Server Error");
            return;
          }

          // Query to get product details for each order item
          const productIds = orderItemsResults.map((item) => item.productId);
          const productsQuery = "SELECT * FROM products WHERE id IN (?)";

          connection.query(
            productsQuery,
            [productIds],
            (productsQueryError, productsResults) => {
              // Release the connection back to the pool
              connection.release();

              if (productsQueryError) {
                console.error(
                  "Error querying products table: " + productsQueryError.message
                );
                res.status(500).send("Internal Server Error");
                return;
              }

              // Combine orders, order items, and product details
              const ordersWithItems = ordersResults.map((order) => {
                const itemsForOrder = orderItemsResults
                  .filter((item) => item.orderId === order.id)
                  .map((item) => {
                    const product = productsResults.find(
                      (product) => product.id === item.productId
                    );
                    return { ...item, product };
                  });

                return { ...order, items: itemsForOrder };
              });

              // Send the combined results as JSON
              res.json(ordersWithItems);
            }
          );
        }
      );
    });
  });
});

app.put("/api/update/:orderId", authenticateToken, async (req, res) => {
  const orderId = req.params.orderId;
  const newStatus = req.body.newStatus;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: " + err.message);
      res.status(500).send("Internal Server Error");
      return;
    }

    connection.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [newStatus, orderId],
      (err, result) => {
        connection.release();
        if (err) {
          console.error("updating order status error:", err);
          return res
            .status(500)
            .json({ error: "Failed Updating Order Status" });
        }
        console.log(orderId, " successfully updated.");
        return res
          .status(200)
          .json({ message: "Order status updated successfully" });
      }
    );
  });
});

app.get("/dashboard", authenticateToken, (req, res) => {
  const user = req.user;
  res.send(`Welcome to the dashboard, ${user.username}!`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
