const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.generateTokens = async (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // Save refresh token in DB
  await User.findByIdAndUpdate(userId, {
    $push: { refreshTokens: { token: refreshToken } }
  });

  return { accessToken, refreshToken };
};
