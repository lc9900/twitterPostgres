// const express = require('express');
// const router = express.Router();
const router = require('express').Router();
const path = require('path');
const db = require('../db')

// const tweetBank = require('../tweetBank');

module.exports = function(io){

    router.get('/', function (req, res, next) {
        var sql = 'select tweets.id, users.name, tweets.content from tweets join users on user_id = users.id;';
        var params = [];
        let tweets = db.query(sql, params, function(err, result){
            if(err) next(err);
            res.render( 'index', { tweets: result.rows, showForm: true} );
        });

    });

    router.post('/tweets', function(req, res, next){
        // This method would add the user's tweet.
        // If the user doesn't exist, then create the user
        var name = req.body.name;
        var text = req.body.text;
        // result should be {name: username, id: tweetId, content: tweetContent}
        db.add(name, text, function(err, result){
            if(err) next(err);
            io.socket.emit('newTweet', result);
        });
     });

    // router.post('/tweets', function(req, res) {
    //  var name = req.body.name;
    //  var text = req.body.text;
    //  tweetBank.add(name, text);
 //        var obj = {name: name, content: text};
 //        var singleTweet = tweetBank.find(obj);
 //        io.sockets.emit('newTweet', singleTweet[0]);
    //  // res.redirect('/');
    // });

    // router.get('/users/:name', function(req, res) {
    //  var name = req.params.name;
    //  var list = tweetBank.find( {name: name} );
    //  res.render( 'index', { tweets: list, showForm: true, userName: name } );

    // });

    // router.get('/tweets/:id', function(req, res) {
    //  var id = parseInt(req.params.id);
    //  var list = tweetBank.find( {id: id} );
    //  res.render( 'index', { tweets: list } );
    // });

    return router;
}
