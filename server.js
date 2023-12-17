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

  try {
    
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });

    if (existingUser) {
      let errorMessage = "";
      if (existingUser.email === email) errorMessage = "Email already in use";
      if (existingUser.username === username) {
        errorMessage += errorMessage.length > 0 ? " and " : "";
        errorMessage += "Username already in use";
      }
      return res.status(400).json({ error: errorMessage });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const newUser = await prisma.users.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstname,
        lastname,
        program,
        yearlevel: +yearlevel,
      },
    });

    console.log("User registered:", newUser);
    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/place-order", async (req, res) => {
  const orderData = req.body;

  try {
    const orderResult = await prisma.orders.create({
      data: {
        userId: orderData.userId,
        email: orderData.email,
        fullName: orderData.fullName,
        course: orderData.program,
        year: orderData.yearLevel.toString(),
        total: orderData.total,
        order_items: {
          create: orderData.cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        },
      },
    });

    console.log("Order placed successfully");
    return res.status(200).json({ message: "Order placed successfully" });
  } catch (error) {
    console.error("Order placement error:", error);
    return res.status(500).json({ error: "Order placement failed" });
  }
});

app.put("/api/update-email/:userID", async (req, res) => {
  const userID = parseInt(req.params.userID, 10);
  const newEmail = req.body.newEmail;

  if (!newEmail || !newEmail.endsWith("@usc.edu.ph")) {
    return res.status(400).json({ error: "Invalid or missing email format" });
  }

  try {
    const updateUser = await prisma.users.update({
      where: {
        id: userID,
      },
      data: {
        email: newEmail,
      },
    });

    if (updateUser) {
      console.log("Email updated for user with ID:", userID);
      return res.status(200).json({ message: "Email updated successfully" });
    } else {
      console.error("Email update error: User not found");
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Email update error:", error);
    return res.status(500).json({ error: "Email update failed" });
  }
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

app.post("/api/posts/:postId/like", authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  const userId = req.user.id;

  try {
    const existingLike = await prisma.likes.findFirst({
      where: {
        postId,
        userId,
      },
    });

    if (existingLike) {
      return res.status(400).json({ error: "Post already liked" });
    }

    const newLike = await prisma.likes.create({
      data: {
        postId,
        userId,
      },
    });

    if (newLike) {
      console.log("Post liked successfully");
      return res.status(200).json({ message: "Post liked successfully" });
    } else {
      console.error("Error liking post");
      return res.status(500).json({ error: "Error liking post" });
    }
  } catch (error) {
    console.error("Error checking or liking post:", error);
    return res.status(500).json({ error: "Error checking or liking post" });
  }
});

app.get("/api/posts/:postId/userLikes", authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  const userId = req.user.id;

  try {
    const likeCount = await prisma.likes.count({
      where: {
        postId,
        userId,
      },
    });

    return res.status(200).json({ liked: likeCount > 0 });
  } catch (error) {
    console.error("Error checking like status:", error);
    return res.status(500).json({ error: "Error checking like status" });
  }
});

app.delete(
  "/api/comments/:commentId/delete",
  authenticateToken,
  async (req, res) => {
    const commentId = parseInt(req.params.commentId, 10);
    const userId = req.user.id;

    try {
      const comment = await prisma.comments.findUnique({
        where: {
          id: commentId,
        },
        select: {
          userId: true,
        },
      });

      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      if (userId !== comment.userId && req.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Unauthorized to delete this comment" });
      }

      const deleteResult = await prisma.comments.delete({
        where: {
          id: commentId,
        },
      });

      if (deleteResult) {
        console.log("Comment deleted successfully");
        return res
          .status(200)
          .json({ message: "Comment deleted successfully" });
      } else {
        console.error("Error deleting comment");
        return res.status(500).json({ error: "Error deleting comment" });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      return res.status(500).json({ error: "Error deleting comment" });
    }
  }
);

app.put(
  "/api/users/updateStatus/:userId",
  authenticateToken,
  async (req, res) => {
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

    const userId = parseInt(req.params.userId, 10);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    try {
      const updateUser = await prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          status: status,
        },
      });

      if (updateUser) {
        console.log("User status updated successfully");
        return res.json({ message: "User status updated successfully" });
      } else {
        console.error("Error updating user status: User not found");
        return res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      return res.status(500).json({ error: "Error updating user status" });
    }
  }
);

app.delete("/api/posts/delete/:postId", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Unauthorized: Admin access required" });
  }

  const postId = parseInt(req.params.postId, 10);

  try {
    const deleteResult = await prisma.posts.delete({
      where: {
        id: postId,
      },
    });

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    console.log("Post deleted:", deleteResult);
    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ error: "Error deleting post" });
  }
});

app.get("/api/posts/:postId/likesCount", async (req, res) => {
  const postId = req.params.postId;

  try {
    const likesCount = await prisma.likes.count({
      where: {
        postId: +postId,
      },
    });

    return res.status(200).json({ count: likesCount });
  } catch (error) {
    console.error("Error fetching likes count:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect(); 
  }
});

app.delete("/api/posts/:postId/unlike", authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  const userId = req.user.id;

  try {
    const deleteResult = await prisma.likes.deleteMany({
      where: {
        postId,
        userId,
      },
    });

    if (deleteResult.count > 0) {
      console.log("Post unliked successfully");
      return res.status(200).json({ message: "Post unliked successfully" });
    } else {
      console.error("Error unliking post: Like not found");
      return res.status(404).json({ error: "Like not found" });
    }
  } catch (error) {
    console.error("Error unliking post:", error);
    return res.status(500).json({ error: "Error unliking post" });
  }
});

app.post("/api/categories/add", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Unauthorized: Admin access required" });
  }

  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    const newCategory = await prisma.categories.create({
      data: {
        name: name,
      },
    });

    console.log("Category added successfully");
    return res.status(201).json({
      message: "Category added successfully",
      newCategoryId: newCategory.id,
    });
  } catch (error) {
    console.error("Error adding category:", error);
    return res.status(500).json({ error: "Error adding category" });
  }
});

app.delete(
  "/api/categories/delete/:id",
  authenticateToken,
  async (req, res) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized: Admin access required" });
    }

    const categoryId = parseInt(req.params.id, 10);

    try {
      const deleteResult = await prisma.categories.delete({
        where: {
          id: categoryId,
        },
      });

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      console.log("Category deleted successfully");
      return res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      return res.status(500).json({ error: "Error deleting category" });
    }
  }
);

app.post("/api/posts/:postId/comment", authenticateToken, async (req, res) => {
  if (req.user.status === "muted") {
    return res.status(403).json({ error: "You are muted and cannot comment" });
  }

  const postId = parseInt(req.params.postId, 10);
  const userId = req.user.id;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
    const newComment = await prisma.comments.create({
      data: {
        postId: postId,
        userId: userId,
        comment: comment,
      },
    });

    console.log("Comment added successfully");
    return res.status(201).json({ message: "Comment added successfully" });
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({ error: "Error adding comment" });
  }
});

app.get("/api/posts/all", async (req, res) => {
  try {
    const posts = await prisma.posts.findMany({
      select: {
        id: true,
        userId: true,
        title: true,
        content: true,
        timestamp: true,
        image_urls: true,
        users: {
          select: {
            username: true,
            email: true,
            role: true,
          },
        },
        category: true,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ error: "Error fetching posts" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.products.findMany();
    return res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Error fetching products" });
  }
});

app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.json({ message: "Unauthorized: Admin access required" });
    }

    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Error fetching users" });
  }
});

app.put(
  "/api/users/updateRole/:userId",
  authenticateToken,
  async (req, res) => {
    try {
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
      const userId = parseInt(req.params.userId, 10);

      if (!role) {
        return res.status(400).json({ error: "Role is required" });
      }

      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: { role },
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      return res.status(500).json({ error: "Error updating user role" });
    }
  }
);

app.get("/api/posts/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);

    const post = await prisma.posts.findFirst({
      where: { id: postId },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.json({
      id: post.id,
      userId: post.userId,
      title: post.title,
      content: post.content,
      createdAt: post.timestamp,
      imageUrl: post.image_url,
      username: post.users.username,
      email: post.users.email,
      role: post.users.role,
      category: post.category,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return res.status(500).json({ error: "Error fetching post" });
  }
});

app.get("/api/posts/:postId/comments", async (req, res) => {
  try {
    const postId = parseInt(req.params.postId, 10);

    const comments = await prisma.comments.findMany({
      where: { postId },
      include: {
        users: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({ error: "Error fetching comments" });
  }
});

app.get("/api/users/:userId/profilePhoto", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { profile_photo: true },
    });

    if (user && user.profile_photo) {
      return res.json({ profilePhotoPath: user.profile_photo });
    } else {
      return res
        .status(404)
        .json({ error: "User not found or no profile photo" });
    }
  } catch (error) {
    console.error("Error fetching user profile photo:", error);
    return res.status(500).json({ error: "Error fetching profile photo" });
  } finally {
    await prisma.$disconnect(); 
  }
});

app.get("/api/users/profilePhoto", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { profile_photo: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const profilePhotoPath = user.profile_photo;
    if (profilePhotoPath) {
      return res.json({ profilePhotoPath });
    } else {
      return res.json({ profilePhotoPath: null });
    }
  } catch (error) {
    console.error("Error fetching user profile photo:", error);
    return res.status(500).json({ error: "Error fetching profile photo" });
  }
});

app.post(
  "/api/users/uploadProfilePhoto",
  authenticateToken,
  upload.single("profile_photo"),
  async (req, res) => {
    const userId = req.user.id;
    let profilePhotoPath = null;

    try {
      await prisma.$transaction(async (prisma) => {
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
            fs.writeFileSync(path.join("/uploads", newFilename), outputBuffer);

            profilePhotoPath = `/uploads/${newFilename}`;

            fs.unlinkSync(image.path);
          } else {
            profilePhotoPath = `/uploads/${image.filename}`;
          }
        }

        if (profilePhotoPath) {
          await prisma.users.update({
            where: { id: userId },
            data: { profile_photo: profilePhotoPath },
          });
        } else {
          res.status(400).json({ error: "No image file provided" });
          throw new Error("No image file provided");
        }
      });

      res.json({
        message: "Profile photo updated successfully",
        profilePhotoPath,
      });
    } catch (error) {
      console.error("Error during image processing:", error);
      res.status(500).json({ error: "Error processing image file" });
    }
  }
);

app.post(
  "/api/posts/create",
  authenticateToken,
  upload.array("images", 20), 
  async (req, res) => {
    try {
      if (req.user.status === "muted") {
        return res.status(403).json({ error: "You are muted and cannot post" });
      }

      const { content, title, category } = req.body;
      const userId = req.user.id;

      if (!content || !title) {
        return res
          .status(400)
          .json({ error: "Title and content are required for the post" });
      }

      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const ext = path.extname(file.originalname).toLowerCase();
          if (ext === ".heic" || ext === ".heif") {
            const inputBuffer = fs.readFileSync(file.path);
            const outputBuffer = await heicConvert({
              buffer: inputBuffer,
              format: "JPEG",
              quality: 1,
            });

            const newFilename = file.filename.replace(ext, ".jpg");
            fs.writeFileSync(path.join("/uploads", newFilename), outputBuffer);
            imageUrls.push(`/uploads/${newFilename}`);
            fs.unlinkSync(file.path);
          } else {
            imageUrls.push(`/uploads/${file.filename}`);
          }
        }
      }

      const post = await prisma.posts.create({
        data: {
          userId,
          title,
          content,
          timestamp: new Date(),
          category,
          image_urls: JSON.stringify(imageUrls),
        },
      });

      console.log("Post created:", post);
      return res
        .status(201)
        .json({ message: "Post created successfully", post });
    } catch (error) {
      console.error("Post creation error:", error);
      return res.status(500).json({ error: "Post creation failed" });
    } finally {
      await prisma.$disconnect();
    }
  }
);

app.use("/uploads", express.static("/uploads"));

app.post("/api/users/findUserId", authenticateToken, async (req, res) => {
  const { username } = req.body;

  try {
    const user = await prisma.users.findFirst({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = user.id;
    return res.json({ userId });
  } catch (error) {
    console.error("Error finding user:", error);
    return res.status(500).json({ error: "Error finding user" });
  }
});

app.get("/api/categories", (req, res) => {
  prisma.categories
    .findMany()
    .then((categories) => {
      return res.json(categories);
    })
    .catch((error) => {
      console.error("Error fetching categories:", error);
      return res.status(500).json({ error: "Error fetching categories" });
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

  prisma.announcements
    .create({
      data: {
        message: message,
        timestamp: new Date(),
      },
    })
    .then(() => {
      return res
        .status(201)
        .json({ message: "Announcement created successfully" });
    })
    .catch((error) => {
      console.error("Error creating announcement:", error);
      return res.status(500).json({ error: "Error creating announcement" });
    });
});

app.get("/api/announcements/latest", async (req, res) => {
  try {
    const latestAnnouncement = await prisma.announcements.findFirst({
      orderBy: {
        timestamp: "desc",
      },
    });

    if (!latestAnnouncement) {
      return res.status(404).json({ error: "No announcements found" });
    }

    return res.json(latestAnnouncement);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return res.status(500).json({ error: "Error fetching announcement" });
  }
});

app.get("/api/orders/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  try {
    
    const orders = await prisma.orders.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    if (orders.length === 0) {
      return res.status(404).json({ error: "No orders found for the user" });
    }

    
    const orderIds = orders.map((order) => order.id);

    
    const orderItems = await prisma.order_items.findMany({
      where: {
        orderId: {
          in: orderIds,
        },
      },
    });

    
    const productIds = orderItems.map((item) => item.productId);

    
    const products = await prisma.products.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    
    const ordersWithItems = orders.map((order) => {
      const itemsForOrder = orderItems
        .filter((item) => item.orderId === order.id)
        .map((item) => {
          const product = products.find(
            (product) => product.id === item.productId
          );
          return { ...item, product };
        });

      return { ...order, items: itemsForOrder };
    });

    res.json(ordersWithItems);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/order/all", async (req, res) => {
  try {
    
    const orders = await prisma.orders.findMany({
      orderBy: {
        timestamp: "desc",
      },
    });

    if (orders.length === 0) {
      return res.status(404).json({ error: "No orders found" });
    }

    
    const orderIds = orders.map((order) => order.id);

    
    const orderItems = await prisma.order_items.findMany({
      where: {
        orderId: {
          in: orderIds,
        },
      },
    });

    
    const productIds = orderItems.map((item) => item.productId);

    
    const products = await prisma.products.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    
    const ordersWithItems = orders.map((order) => {
      const itemsForOrder = orderItems
        .filter((item) => item.orderId === order.id)
        .map((item) => {
          const product = products.find(
            (product) => product.id === item.productId
          );
          return { ...item, product };
        });

      return { ...order, items: itemsForOrder };
    });

    res.json(ordersWithItems);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/update/:orderId", authenticateToken, async (req, res) => {
  const orderId = req.params.orderId;
  const newStatus = req.body.newStatus;

  try {
    
    const updateResult = await prisma.orders.update({
      where: {
        id: +orderId,
      },
      data: {
        status: newStatus,
      },
    });

    if (updateResult) {
      console.log(`Order ${orderId} successfully updated.`);
      return res
        .status(200)
        .json({ message: "Order status updated successfully" });
    } else {
      return res.status(404).json({ error: "Order not found" });
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ error: "Failed updating order status" });
  }
});

















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

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const token1 = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const tokenParts = token1.split(".");
    const token = tokenParts[1];

    const user = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });

    if (user) {
      const resetRecord = await prisma.password_resets.create({
        data: {
          user_id: user.id,
          reset_token: token,
          
        },
      });


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
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error in forgot-password route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect(); 
  }
});

app.get("/api/verify/:token", async (req, res) => {
  try {
    const resetToken = req.params.token;

    const resetRecord = await prisma.password_resets.findFirst({
      where: {
        reset_token: resetToken,
        used: false,
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
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
  } finally {
    await prisma.$disconnect(); 
  }
});

app.put("/api/update-password/:email", async (req, res) => {
  const userEmail = req.params.email;
  const newPassword = req.body.newPassword;

  if (!newPassword) {
    return res.status(400).json({ error: "Invalid or missing new password" });
  }

  try {
    
    const user = await prisma.users.findFirst({
      where: {
        email: userEmail,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentPasswordHash = user.password;

    
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

    await prisma.users.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    console.log("Password updated for user with email:", userEmail);
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    return res.status(500).json({ error: "Password update failed" });
  } finally {
    await prisma.$disconnect(); 
  }
});

app.get("/dashboard", authenticateToken, (req, res) => {
  const user = req.user;
  res.send(`Welcome to the dashboard, ${user.username}!`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
