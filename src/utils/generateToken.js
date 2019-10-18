const jwt = require("jsonwebtoken");
const JWT_SECRET = "test123"; //process.env.JWT_SECRET;

const generateToken = userId => {
    return jwt.sign({ userId }, JWT_SECRET, {
        expiresIn: "7d"
    });
};
module.exports = { JWT_SECRET, generateToken };
