var db = require("ep_etherpad-lite/node/db/DB").db;


exports.getAuthor4Username = function(username, callback)
{
    db.get('username2author:' + username, function(err, authorId) {
	return(callback(err, authorId));
    });
} 

exports.setAuthor4Username = function(authorId, username)
{
    return db.set('username2author:' + username, authorId);
}

exports.setToken4Author = function(token, authorId)
{
    return db.set('token2author:' + token, authorId);
}
