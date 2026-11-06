const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Change these if you want
    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "admin123";

    if (
      username !== ADMIN_USERNAME ||
      password !== ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid Username or Password",
      });
    }

    const token = jwt.sign(
      {
        username: ADMIN_USERNAME,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};