const fs = require("fs");
const { Router } = require('express');
const verify_auth = require('../../middleware/auth.js');
const connection = require('../../config/db.js');
const { get_account_by_id } = require('../users/users.query.js');
const { get_user_unlocked_animals, set_animal_unlocked } = require('./user.query.js');
const pois = require("../../pois.js");

const user_router = Router();

user_router.get('/', verify_auth, async (req, res) => {
    const account = await get_account_by_id(connection, req.token_id);
    if (!account)
        return res.status(404).json({ msg: "Not found" });

    return res.status(200).json(account);
});

user_router.get('/animals', verify_auth, async (req, res) => {
    const account = await get_account_by_id(connection, req.token_id);
    if (!account)
        return res.status(404).json({ msg: "Not found" });

    const animals = pois.filter(p => p.type === "animaux");
    const unlocked_animals = await get_user_unlocked_animals(connection, req.token_id);

    const output = animals.map(animal => {
        return {
            ...animal,
            unlocked: unlocked_animals.map(a => a.animal).includes(animal.name)
        }
    });

    return res.status(200).json(output);
});

user_router.post('/unlock', verify_auth, async (req, res) => {
    const account = await get_account_by_id(connection, req.token_id);
    if (!account)
        return res.status(404).json({ msg: "Not found" });

    const unlocked_animal = "Ours polaires";

    await set_animal_unlocked(connection, account.id, unlocked_animal);

    return res.status(200).json({
        unlocked: unlocked_animal
    });
});

module.exports = user_router;
