const { Router } = require('express');
const verify_auth = require('../../middleware/auth.js');
const bcrypt = require("bcryptjs");
const connection = require('../../config/db.js');
const { get_account_by_id, delete_user } = require('./users.query.js');

const users_router = Router();

users_router.route('/:id')
    .get(verify_auth, async (req, res) => {
        const account = await get_account_by_id(connection, req.params.id);
        if (!account)
            return res.status(404).json({ msg: "Not found" });

        res.status(200).json(account);
    })
    .delete(verify_auth, async (req, res) => {
        if (!(await get_account_by_id(connection, req.params.id)))
            return res.status(404).json({ msg: "Not found" });

        if (await delete_user(connection, req.params.id))
            return res.status(500).json({ msg: "Internal server error" });

        return res.status(200).json({ msg: `Successfully deleted record number: ${req.params.id}` });
    });

module.exports = users_router;
