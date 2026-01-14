const fs = require("fs");
const { Router } = require('express');
const verify_auth = require('../../middleware/auth.js');
const { calculatePoiAffluence } = require("../../socket.js");

const pois_router = Router();

pois_router.route('/')
    .get(async (req, res) => {
        return res.status(200).json(calculatePoiAffluence());
    })

module.exports = pois_router;
