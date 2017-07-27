const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);

client.connect(function(err){
    if(err) console.log(err.message);
});

function query(sql, params, cb){
    client.query(sql, params, function(err, result){
        if(err) return cb(err);
        cb(null, result.rows);
    });
}

// Find user ID by name.
// This assumes all user names are unique
function findUserIdByName(name, cb){
    var sql = ``;
    query(sql, [name], function(err, rows){
        if(err) return cb(err);
        // If successful, I should get either 0 rows which means user doesn't exist,
        // or at least one row.
        if(rows.length > 0) return cb(null, rows[0].id);
        else return false; // False indicating user doesn't exist
    });
}

// addUser name should also return userId created
function addUser(name, cb){
    var sql = ``;
    query(sql, [name], function(err, rows){
        // The callback uses rows because we use the generic query method
        // where it only returns the 'rows' array
        if(err) return cb(err);
        cb(null, rows[0].id);
    });
}

// addTweet should return the tweet ID in the cb
function addTweet(userId, tweetContent, cb){
    var sql = ``;
    query(sql, [userId, tweetContent], function(err, rows){
        if(err) return cb(err);
        cb(null, rows[0].id);
    });

}

// result should be {name: username, id: tweetId, content: tweetContent}
function add(userName, tweetContent, cb){
    // Check if user exist, if so get user ID. If not, add the user and get ID
    db.findUserIdByName(userName, function(err, userId){
        if(err) return cb(err);
        if(userId){
            // Add tweet
            addTweet(userId, tweetContent, function(err, tweetId){
                if(err) return cb(err);
                cb(null, {'name': userName, 'id': tweetId, 'content': tweetContent});
            });
        }
        else{
            // Add user
            addUser(userName, function(err, userId){
                if(err) return cb(err);
                // Now that we added the user, and got the ID, add the tweet
                addTweet(userId, tweetContent, function(err, tweetId){
                    if(err) return cb(err);
                    cb(null, {'name': userName, 'id': tweetId, 'content': tweetContent});
                });
            });
        }
    });


}

function sync(cb){
    // Got to drop tweets before users, because tweets uses users' id field.
    // So postgres won't let you drop users first, because tweets depends on it.
    var sql = `
                DROP TABLE IF EXISTS tweets;
                DROP TABLE IF EXISTS users;
                CREATE TABLE users (id SERIAL PRIMARY KEY,
                name TEXT DEFAULT NULL,
                picture_url TEXT
                );

                CREATE TABLE tweets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) NOT NULL,
                content TEXT DEFAULT NULL
                );`;
    query(sql, [], function(err){
        if(err) return cb(err);
        cb(null);
    });

}

function seed(cb){
    var sql = `
                INSERT INTO users (name, picture_url) VALUES ('Tom Hanks',           'http://i.imgur.com/XDjBjfu.jpg');
                INSERT INTO users (name, picture_url) VALUES ('Beyonce',             'http://i.imgur.com/1uTV9v2.jpg');
                INSERT INTO users (name, picture_url) VALUES ('Justin Bieber',       'http://i.imgur.com/bI1zf2b.jpg');
                INSERT INTO users (name, picture_url) VALUES ('Ash Ketchum',         'http://i.imgur.com/n7VJIua.jpg');
                INSERT INTO users (name, picture_url) VALUES ('E.T.',                'http://i.imgur.com/Rs7b2FA.jpg');
                INSERT INTO users (name, picture_url) VALUES ('William Shakespeare', 'http://i.imgur.com/7d10la4.jpg');
                INSERT INTO users (name, picture_url) VALUES ('Grace Hopper',        'http://i.imgur.com/fHmZW3G.jpg');
                INSERT INTO users (name, picture_url) VALUES ('Kanye West',          'http://i.imgur.com/MItGWVS.jpg');
                INSERT INTO users (name, picture_url) VALUES ('Taylor Swift',        'http://i.imgur.com/JKInSVz.jpg');

                INSERT INTO tweets (user_id, content) VALUES ((SELECT id from users where name='Grace Hopper'),        'It''s easier to ask forgiveness than it is to get permission.');
                INSERT INTO tweets (user_id, content) VALUES ((SELECT id from users where name='William Shakespeare'), 'to.be or to.not.be, that is the question.');
                INSERT INTO tweets (user_id, content) VALUES ((SELECT id from users where name='Beyonce'),             'If you liked it then you should have put a Promise on it.');
                INSERT INTO tweets (user_id, content) VALUES ((SELECT id from users where name='Tom Hanks'),           'Life is like an array of chocolates.');
                INSERT INTO tweets (user_id, content) VALUES ((SELECT id from users where name='Justin Bieber'),       'Is it too late now to say sorry? Cuz I''m missing more than just your <body></body>.');
                INSERT INTO tweets (user_id, content) VALUES ((SELECT id from users where name='Ash Ketchum'),         'char mander, I choose you!');
                INSERT INTO tweets (user_id, content) VALUES ((SELECT id from users where name='E.T.'),                'E.T. Slack Home.');
                INSERT INTO tweets (user_id, content) VALUES ((SELECT id from users where name='Taylor Swift'),        'I knew you were trouble when you logged in.');
                INSERT INTO tweets (user_id, content) VALUES ((SELECT id from users where name='Taylor Swift'),        'I''ve got some whitespace baby — and I''ll write your \`.name\`');
                INSERT INTO tweets (user_id, content) VALUES ((SELECT id from users where name='Kanye West'),          'I think what Kanye West is going to mean is something similar to what Steve Jobs means.');
                INSERT INTO tweets (user_id, content) VALUES ((SELECT id from users where name='Kanye West'),          'I''ma let you finish coding, but…');
        `;
    query(sql, [], function(err){
        if(err) return cb(err);
        cb(null);
    });
}

module.exports = {
    client,
    query,
    add,
    sync,
    seed
};
