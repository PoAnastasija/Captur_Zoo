require("dotenv").config()
const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connection = require("../../config/db.js");
const { get_account_by_username, create_account } = require("./auth.query.js");

const auth_router = Router();

auth_router.post("/register", async (req, res) => {
    if (!req.body?.username)
        return res.status(400).json({ msg: "Bad parameter" });

    const account = await get_account_by_username(connection, req.body.username);
    if (account === undefined)
        return res.status(500).json({ msg: "Internal server error" });
    if (account !== null)
        return res.status(409).json({ msg: "Account already exists" });

    if (await create_account(connection, req.body.username))
        return res.status(500).json({ msg: "Internal server error" });

    const new_account = await get_account_by_username(connection, req.body.username);
    if (!new_account)
        return res.status(500).json({ msg: "Internal server error" });

    const token = jwt.sign(new_account, process.env.SECRET, {
        expiresIn: "1d"
    });
    return res.status(201).json({ token: token });
});

auth_router.post("/login", async (req, res) => {
    if (!req.body?.username)
        return res.status(400).json({ msg: "Bad parameter" });

    const account = await get_account_by_username(connection, req.body.username);
    if (!account)
        return res.status(401).json({ msg: "Invalid Username" });

    const token = jwt.sign(account, process.env.SECRET, {
        expiresIn: "1d"
    });
    return res.status(200).json({ token: token });
})

module.exports = auth_router;
