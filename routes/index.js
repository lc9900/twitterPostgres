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
        var backURL=req.header('Referer') || '/';
        // result should be {name: username, id: tweetId, content: tweetContent}
        db.add(name, text, function(err, result){
            if(err) next(err);

            // Having io.sockets.emit is only so that other client can see it
            // w/o reloading the page. Yourself should still be redirected.
            // Otherwise, your browser will always trying to  go to the form
            // submission url /tweets
            io.sockets.emit('newTweet', result);
            // console.log('posted');
            res.redirect(backURL || '/');
        });
        // res.end();
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

    router.get('/users/:name', function(req, res, next){
        var name = req.params.name;
        // result should be a list of {name: username, id: tweetId, content: tweetContent}
        db.findTweetByName(name, function(err, result){
            if (err) next(err);
            res.render('index', {tweets: result.rows, showForm: true, userName: name});
        });
    });

    // router.get('/users/:name', function(req, res) {
    //  var name = req.params.name;
    //  var list = tweetBank.find( {name: name} );
    //  res.render( 'index', { tweets: list, showForm: true, userName: name } );

    // });

    router.get('/tweets/:id', function(req, res, next){
        var id = parseInt(req.params.id);
        db.findTweetById(id, function(err, result){
            if (err) next(err);
            res.render( 'index', { tweets: result.rows } );
        });
    });
    // router.get('/tweets/:id', function(req, res) {
    //  var id = parseInt(req.params.id);
    //  var list = tweetBank.find( {id: id} );
    //  res.render( 'index', { tweets: list } );
    // });

    return router;
}
