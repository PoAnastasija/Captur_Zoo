const { Router } = require("express");

const auth_router = require("./auth/auth.js");
const user_router = require("./user/user.js");
const users_router = require("./users/users.js");
const pois_router = require("./pois/pois.js");
const detect_router = require("./detect/detect.js");

const api_router = Router();

api_router.use("/", auth_router);
api_router.use("/user", user_router);
api_router.use("/users", users_router);
api_router.use("/pois", pois_router);
api_router.use("/detect", detect_router);

module.exports = api_router;
