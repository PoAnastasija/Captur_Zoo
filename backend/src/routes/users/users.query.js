const { format_date } = require('../../utils.js');

async function get_account_by_id(connection, id) {
    try {
        const [results] = await connection.query('SELECT * FROM user WHERE id = ?', [id]);
        if (results.length === 0)
            return null;
        results[0].created_at = format_date(results[0].created_at);
        return results[0];
    } catch (err) {
        console.error(err);
        return undefined;
    }
}

async function delete_user(connection, id) {
    try {
        await connection.query('DELETE FROM user WHERE id = ?', [id]);
        return false;
    } catch (err) {
        console.error(err);
        return true;
    }
}

module.exports = { get_account_by_id, delete_user };
