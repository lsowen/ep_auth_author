var settings = require('ep_etherpad-lite/node/utils/Settings');
var authorManager = require('ep_etherpad-lite/node/db/AuthorManager');
var sessioninfos = require('ep_etherpad-lite/node/handler/PadMessageHandler').sessioninfos;
var userManager = require('./UserManager');
var log4js = require('log4js');
var logger = log4js.getLogger("ep_auth_author")

function initializeAuthAuthorState(username, authorId, authorName) {

    return {'id': authorId,
	    'username': username,
	    'shouldOverrideClient': authorId !== null,
	    'state': 'INIT',
	    'authorName': authorName
	   }
    
}

exports.handleMessage = function(hook_name, context, cb) {
    logger.debug('handleMessage called');
    //TODO: called on every message received, so need to do some access checking


    if( context.message.type === "CLIENT_READY" && context.client.request.session.auth_author ) {
	var req = context.client.request;
	
	if( req.session.auth_author.id
	    && context.message.token
	    && req.session.auth_author.state === 'INIT'
	    && req.session.auth_author.shouldOverrideClient === true ) {
	    // If session.auth_author.id is not null, and token is supplied, update database to
	    // assign the token to the existing authorId
	    userManager.setToken4Author(context.message.token, req.session.auth_author.id);
	    logger.info('Set token ' + context.message.token + ' for author ' + req.session.auth_author.id);
	    req.session.auth_author.state = 'COMPLETE';
	    return( cb([context.message]) );
	}



	if( context.message.token
	    && req.session.auth_author.state === 'INIT'
	    && req.session.auth_author.shouldOverrideClient === false ) {
	    // If token is supplied, create author so we can stuff in the default username

	    authorManager.getAuthor4Token(context.message.token, function(err, authorId) {
		if( authorId ) {
		    req.session.auth_author.id = authorId;
		    userManager.setAuthor4Username(authorId, req.session.auth_author.username);
		    logger.info('Set author ' + authorId + ' for user ' +  req.session.auth_author.username);
		    req.session.auth_author.state = 'COMPLETE';
		    authorManager.setAuthorName(authorId, req.session.auth_author.authorName, function(){			    
			logger.debug('Set AuthorName to default value of ' + req.session.auth_author.authorName + ' for author ' + authorId);
			return( cb([context.message]) );
		    });		    
		} else {
		    return( cb([context.message]) );
		}
	    });

	    return;
	}
    }
    
    return( cb([context.message]) );
}

exports.authenticate = function(hook_name, context, cb) {
    logger.debug('authenticate called');
    // If auth headers are present use them to authenticate...
    if (context.req.headers.authorization && context.req.headers.authorization.search('Basic ') === 0) {
	var userpass = new Buffer(context.req.headers.authorization.split(' ')[1], 'base64').toString().split(":")
	var username = userpass.shift();
	var password = userpass.join(':');

	var username_prefix = settings.ep_auth_author.prefix;

	if (username_prefix === undefined) {
	    return cb([false]);
	}

	var prefixed_username = username_prefix + username;
	
	if (settings.users[prefixed_username] != undefined && settings.users[prefixed_username].password == password) {
	    settings.users[prefixed_username].username = username;
	    context.req.session.user = settings.users[prefixed_username];

	    return( userManager.getAuthor4Username(prefixed_username, function(err, authorId) {
		logger.debug('retrieved authorId ' + authorId + ' for username ' + prefixed_username);
		context.req.session.auth_author = initializeAuthAuthorState(prefixed_username, authorId, context.req.session.user.author_name);
		return cb([true]);
	    }) );
	    
	}
	
    }

    return cb([false]);
};
