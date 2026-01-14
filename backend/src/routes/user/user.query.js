const { format_date } = require('../../utils.js');

async function get_user_unlocked_animals(connection, id) {
    try {
        const [result] = await connection.query("SELECT * FROM unlocked_animals WHERE user_id = ?", [id]);

        result.forEach(todo => {
            todo.unlocked_at = format_date(todo.created_at);
        });
        return result;
    } catch (err) {
        console.error(err);
        return undefined;
    }
}

module.exports = { get_user_unlocked_animals };
