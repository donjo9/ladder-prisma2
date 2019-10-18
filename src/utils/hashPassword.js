const bcrypt = require("bcryptjs");

const hashPassword = password => {
    if (password.lenght < 8) {
        throw new Error("Password must be longer than 8 chars long");
    }

    return bcrypt.hash(password, 10);
};

module.exports = { hashPassword };
