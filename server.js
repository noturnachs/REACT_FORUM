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
import bodyParser from "body-parser";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = 3000;

app.use(express.json());
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
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
  try {
    const { username, password } = req.body;

    const user = await prisma.users.findFirst({
      where: {
        username: username,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

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
      return res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
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

        return res.status(200).json({ liked: results[0].count > 0 });
      }
    );
  });
});

app.delete("/api/comments/:commentId/delete", authenticateToken, (req, res) => {
  const commentId = req.params.commentId;
  const userId = req.user.id;

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
            userId: post.userId,
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
  if (req.user.role !== "admin") {
    return res.json({ message: "Unauthorized: Admin access required" });
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
          userId: post.userId,
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
  const userId = req.params.userId;

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
          return res.json({ profilePhotoPath: null });
        }
      }
    );
  });
});

app.get("/api/users/profilePhoto", authenticateToken, (req, res) => {
  const userId = req.user.id;

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
          return res.json({ profilePhotoPath: null });
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
              const inputBuffer = fs.readFileSync(image.path);
              const outputBuffer = await heicConvert({
                buffer: inputBuffer,
                format: "JPEG",
                quality: 1,
              });

              const newFilename = image.filename.replace(ext, ".jpg");
              fs.writeFileSync(
                path.join("/uploads", newFilename),
                outputBuffer
              );

              profilePhotoPath = `/uploads/${newFilename}`;

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
          const inputBuffer = fs.readFileSync(image.path);
          const outputBuffer = await heicConvert({
            buffer: inputBuffer,
            format: "JPEG",
            quality: 1,
          });

          const newFilename = image.filename.replace(ext, ".jpg");
          fs.writeFileSync(path.join("/uploads", newFilename), outputBuffer);

          imageUrl = `/uploads/${newFilename}`;

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

app.get("/api/orders/:userId", (req, res) => {
  const userId = req.params.userId;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: " + err.message);
      res.status(500).send("Internal Server Error");
      return;
    }

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

            const productIds = orderItemsResults.map((item) => item.productId);
            const productsQuery = "SELECT * FROM products WHERE id IN (?)";

            connection.query(
              productsQuery,
              [productIds],
              (productsQueryError, productsResults) => {
                connection.release();

                if (productsQueryError) {
                  console.error(
                    "Error querying products table: " +
                      productsQueryError.message
                  );
                  res.status(500).send("Internal Server Error");
                  return;
                }

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
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection: " + err.message);
      res.status(500).send("Internal Server Error");
      return;
    }

    const ordersQuery = "SELECT * FROM orders ORDER BY timestamp DESC";

    connection.query(ordersQuery, (ordersQueryError, ordersResults) => {
      if (ordersQueryError) {
        console.error(
          "Error querying orders table: " + ordersQueryError.message
        );
        res.status(500).send("Internal Server Error");
        return;
      }

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

          const productIds = orderItemsResults.map((item) => item.productId);
          const productsQuery = "SELECT * FROM products WHERE id IN (?)";

          connection.query(
            productsQuery,
            [productIds],
            (productsQueryError, productsResults) => {
              connection.release();

              if (productsQueryError) {
                console.error(
                  "Error querying products table: " + productsQueryError.message
                );
                res.status(500).send("Internal Server Error");
                return;
              }

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

// const getUserByEmail = (email, callback) => {
//   pool.query(
//     "SELECT * FROM users WHERE email = ?",
//     [email],
//     (error, results, fields) => {
//       if (error) {
//         console.error("Error in getUserByEmail:", error);
//         return callback(error, null);
//       }

//       const user = results.length > 0 ? results[0] : null;
//       callback(null, user);
//     }
//   );
// };

const getUserByEmail = async (email) => {
  try {
    const user = await prisma.users.findUnique({
      where: {
        email: email,
      },
    });
    return user;
  } catch (error) {
    console.error("Error in getUserByEmail:", error);
  }
};

// const createPasswordReset = (userId, resetToken, callback) => {
//   pool.query(
//     "INSERT INTO password_resets (user_id, reset_token) VALUES (?, ?)",
//     [userId, resetToken],
//     (error, results, fields) => {
//       if (error) {
//         console.error("Error in createPasswordReset:", error);
//         return callback(error, null);
//       }

//       const resetRecordId = results.insertId;
//       callback(null, resetRecordId);
//     }
//   );
// };

const createPasswordReset = async (userId, resetToken) => {
  try {
    const resetRecord = await prisma.password_resets.create({
      data: {
        user_id: userId,
        reset_token: resetToken,
      },
    });
    return resetRecord;
  } catch (error) {
    console.error("Error in createPasswordReset:", error);
  }
};

app.post("/api/forgot-password", (req, res) => {
  const { email } = req.body;

  const token1 = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  const tokenParts = token1.split(".");
  const token = tokenParts[1];

  getUserByEmail(email, (userError, user) => {
    if (userError) {
      console.error(userError);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (user) {
      createPasswordReset(user.id, token, (resetError, resetRecordId) => {
        if (resetError) {
          console.error(resetError);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: "gptplusdan@gmail.com",
            pass: "kppd pzml objs wejx",
          },
        });

        const mailOptions = {
          from: "gptplusdan@gmail.com",
          to: email,
          subject: "Password Reset",
          text: `Click the following link to reset your password: ${process.env.VITE_WEB_URL}/reset/${token}`,
        };

        transporter.sendMail(mailOptions, (mailError, info) => {
          if (mailError) {
            console.error(mailError);
            return res.status(500).json({ error: "Internal Server Error" });
          }

          console.log("Email sent: " + info.response);
          res.json({
            message:
              "Reset link has been sent. Check your email for instructions.",
          });
        });
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });
});

app.get("/api/verify/:token", async (req, res) => {
  try {
    const resetToken = req.params.token;

    const resetRecord = await prisma.resetToken.findFirst({
      where: {
        reset_token: resetToken,
        used: false,
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Check if created within the last 24 hours
        },
      },
    });

    if (resetRecord) {
      return res.status(200).json({ valid: true });
    } else {
      return res
        .status(400)
        .json({ valid: false, error: "Invalid or expired token" });
    }
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/update-password/:email", async (req, res) => {
  const userEmail = req.params.email;
  const newPassword = req.body.newPassword;

  if (!newPassword) {
    return res.status(400).json({ error: "Invalid or missing new password" });
  }

  pool.query(
    "SELECT password FROM users WHERE email = ?",
    [userEmail],
    async (err, results) => {
      if (err) {
        console.error("Password retrieval error:", err);
        return res
          .status(500)
          .json({ error: "Error retrieving current password" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentPasswordHash = results[0].password;

      const passwordsMatch = await bcrypt.compare(
        newPassword,
        currentPasswordHash
      );
      if (passwordsMatch) {
        return res
          .status(400)
          .json({ error: "New password is the same as the current password" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      pool.query(
        "UPDATE users SET password = ? WHERE email = ?",
        [hashedPassword, userEmail],
        (err, result) => {
          if (err) {
            console.error("Password update error:", err);
            return res.status(500).json({ error: "Password update failed" });
          }

          console.log("Password updated for user with email:", userEmail);
          return res
            .status(200)
            .json({ message: "Password updated successfully" });
        }
      );
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
