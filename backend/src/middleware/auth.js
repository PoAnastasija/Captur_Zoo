const jwt = require("jsonwebtoken");

async function verify_auth(req, res, next) {
    let token = req.headers["authorization"];

    if (!token)
        return res.status(403).json({ msg: "No token, authorization denied" });

    token = token.slice(7, token.length);

    try {
        var decoded = jwt.verify(token, process.env.SECRET, {
            ignoreExpiration: false,
        });
    } catch {
        return res.status(401).json({ msg: "Token is not valid" });
    }
    req.token_id = decoded.id;
    next();
};

module.exports = verify_auth;
