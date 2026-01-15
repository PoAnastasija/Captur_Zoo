const { format_date } = require('../../utils.js');

async function get_user_unlocked_animals(connection, id) {
    try {
        const [result] = await connection.query("SELECT * FROM unlocked_animals WHERE user_id = ?", [id]);

        return result;
    } catch (err) {
        console.error(err);
        return undefined;
    }
}

async function set_animal_unlocked(connection, id, animal) {
    try {
        const [result] = await connection.query('INSERT INTO unlocked_animals (user_id, animal) VALUES (?, ?)',
            [id, animal]);
        return result.insertId;
    } catch (err) {
        console.error(err);
        return undefined;
    }
}

module.exports = { get_user_unlocked_animals, set_animal_unlocked };
