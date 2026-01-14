const { format_date } = require('../../utils.js');

async function get_account_by_username(connection, username) {
    try {
        const [results] = await connection.query('SELECT * FROM user WHERE username = ?', [username]);
        if (results.length === 0)
            return null;
        results[0].created_at = format_date(results[0].created_at);
        return results[0];
    } catch (err) {
        console.error(err);
        return undefined;
    }
}

async function create_account(connection, username) {
    try {
        await connection.query('INSERT INTO user (username) VALUES (?)',
            [username]);
        return false;
    } catch (err) {
        console.error(err);
        return true;
    }
}

module.exports = { get_account_by_username, create_account };
