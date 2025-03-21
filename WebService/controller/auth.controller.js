const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const conn = require("../services/dbconn");
require("dotenv").config();

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await conn.query("SELECT * FROM USERS WHERE Email = ?", [email]);

    if (rows.length === 0) {
      console.log("User not found!");
      return res.status(401).json({ error: "User not found!" });
    }

    const user = rows[0];

    if (!password || !user.Pass) {
      console.log("Password is undefined!");
      return res.status(401).json({ error: "Invalid credentials!" });
    }

    const isMatch = await bcrypt.compare(password, user.Pass);
    if (!isMatch) {
      console.log("Invalid password!");
      return res.status(401).json({ error: "Invalid credentials!" });
    }

    const token = jwt.sign(
      { id: user.USER_ID, email: user.Email, role: user.Role_Admin },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ message: "Login successful!", token });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const signup = async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await conn.query(
      "INSERT INTO USERS (Email, Username, Pass) VALUES (?, ?, ?)",
      [email, username, hashedPassword]
    );

    if (result.affectedRows === 1) {
      res.status(201).json({ message: "User registered successfully!" });
    } else {
      res.status(500).json({ error: "Failed to register user!" });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const checkRole = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.status(403).json({ error: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(403).json({ error: "Invalid token" });
    }
    const role = decoded.role;
    const roleName = role === 1 ? "admin" : "user";
    res.status(200).json({ message: `User role is ${roleName}`, role: roleName });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const logout = async (req, res) => {
  try {
    // Perform any necessary cleanup or logging here
    console.log(`User with ID ${req.user.id} logged out.`);
    res.status(200).json({ message: "Logout successful!" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add the checkStatus function
const checkStatus = async (req, res) => {
  try {
    res.status(200).json({ isLoggedIn: true });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { login, signup, checkRole, logout, checkStatus };
