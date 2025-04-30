const jwt = require("jsonwebtoken");
const path = require('path');

require('dotenv').config();

const secretKey = process.env.SECRET;

function generateToken(userId, role) {
    if (!secretKey) {
        console.log('No secret key provided');
        return null;
    };

    return jwt.sign({ id: userId, role: role }, secretKey, { expiresIn: "1h" });
}

function verifyToken(token) {
    try {
      return jwt.verify(token, secretKey);
    } catch (err) {
      console.error("Invalid Token:", err.message);
      return null;
    }
  }
  
  // Example usage
//   const decoded = verifyToken(token);
//   console.log("Decoded Token:", decoded);
  



module.exports = { generateToken, verifyToken }