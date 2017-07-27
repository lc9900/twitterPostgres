const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
// const client = new pg.Client('postgres://localhost/twitterdb')

client.connect(function(err){
    if(err) console.log(err.message);
});

function query(sql, params, cb){
    // console.log(`SQL is ${sql}`)
    // console.log(`Params is ` + params)
    client.query(sql, params, cb);
}


// Should return a list of {name: username, id: tweetId, content: tweetContent}
function findTweetById(tweetId, cb){
    var sql = `select users.name, tweets.id, tweets.content from users join tweets on users.id = tweets.user_id
                where tweets.id = $1;`;
    query(sql, [tweetId], cb);

}

// Should return a list of {name: username, id: tweetId, content: tweetContent}
function findTweetByName(userName, cb){
    var sql = `select users.name, tweets.id, tweets.content from users join tweets on users.id = tweets.user_id
                where users.name = $1;`;

    query(sql, [userName], cb);

}

// Find user ID by name.
// This assumes all user names are unique
function findUserIdByName(name, cb){
    // console.log("In findUserIdByName")
    var sql = `SELECT * FROM users WHERE name = $1`;
    query(sql, [name], function(err, result){
        if (err) return cb(err);
        // If successful, I should get either 0 rows which means user doesn't exist,
        // or at least one row.
        if (result.rows.length > 0) {
            // console.log("Found the ID");
            cb(null, result.rows[0].id);
        }
        else {
            // console.log("Returning false here")
            cb(null, false); // False indicating user doesn't exist
        }
    });
}

// addUser name should also return userId created
function addUser(name, cb){
    var sql = `INSERT INTO users (name) VALUES ($1) RETURNING id`;
    query(sql, [name], function(err, result){
        // The callback uses rows because we use the generic query method
        // where it only returns the 'rows' array
        if (err) return cb(err);
        cb(null, result.rows[0].id);
    });
}

// addTweet should return the tweet ID in the cb
function addTweet(userId, tweetContent, cb){
    var sql = `INSERT INTO tweets (user_id, content) VALUES ($1, $2) RETURNING id`;
    query(sql, [userId, tweetContent], function(err, result){
        if (err) return cb(err);
        cb(null, result.rows[0].id);
    });

}

// result should be {name: username, id: tweetId, content: tweetContent}
function add(userName, tweetContent, cb){
    // console.log("add is called")
    // Check if user exist, if so get user ID. If not, add the user and get ID
    findUserIdByName(userName, function(err, userId){
        if (err) return cb(err);
        if (userId){
            // console.log("Just need to addTweet");
            // Add tweet
            addTweet(userId, tweetContent, function(err, tweetId){
                if (err) return cb(err);
                cb(null, { name: userName, id: tweetId, content: tweetContent});
            });
        }
        else {
            // console.log("Need to addUser")
            // Add user
            addUser(userName, function(err, userId){
                if (err) return cb(err);
                // Now that we added the user, and got the ID, add the tweet
                addTweet(userId, tweetContent, function(err, tweetId){
                    if (err) return cb(err);
                    cb(null, {name: userName, id: tweetId, content: tweetContent});
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
    seed,
    findTweetByName,
    findTweetById
};


// Test code
///////////////////////////////////////////////
// add('Han Gu', 'Hi I am Han', function(err, result){
//     return console.log(`result is ${result}`);
// });

// findUserIdByName("Tom Hanks", function(err, result){
//     return console.log(`result is ${result}`);
// })

// var sql = `select * from users where name = $1`;
// var params = "Tom Hanks";
// query(sql, [params], function(err, result){
//     if (err) return console.log(err.message);
//     console.log(result.rows);
// })
