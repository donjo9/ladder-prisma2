const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./generateToken");

const getUserId = (request, requiredAuth = true) => {
    const header = request.request
        ? request.request.headers.authorization
        : request.connection.context.Authorization;

    if (header) {
        const token = header.replace("Bearer ", "");
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.userId;
    }

    if (requiredAuth) {
        throw new Error("Authentication required");
    }
    return null;
};

module.exports = { getUserId };
