express = require('express')
app = module.exports = express()


if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

var loginExampleData = {
    version: '0.2.0'
}

var $log = console;

var userRoles = {};
var userStorage = JSON.parse(localStorage.getItem('userStorage')),
emailStorage = JSON.parse(localStorage.getItem('emailStorage')),
tokenStorage = JSON.parse(localStorage.getItem('tokenStorage')) || {},
loginExample = JSON.parse(localStorage.getItem('loginExample'));

// Check and corrects old localStorage values, backward-compatibility!
if (!loginExample || loginExample.version !== loginExampleData.version) {
    userStorage = null;
    tokenStorage = {};
    localStorage.setItem('loginExample', JSON.stringify(loginExampleData));
}

if (userStorage === null || emailStorage === null) {
    userStorage = {
        'johnm': { name: 'John', username: 'johnm', password: 'hello', email: 'john.dott@myemail.com', userRole: userRoles.user, tokens: [] },
        'sandrab': { name: 'Sandra', username: 'sandrab', password: 'world', email: 'bitter.s@provider.com', userRole: userRoles.admin, tokens: [] }
    };
    emailStorage = {
        'john.dott@myemail.com': 'johnm',
        'bitter.s@provider.com': 'sandrab'
    };
    localStorage.setItem('userStorage', JSON.stringify(userStorage));
    localStorage.setItem('emailStorage', JSON.stringify(emailStorage));
}


/**
 * Generates random Token
 */
var randomUUID = function () {
    var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomToken = '';
    for (var i = 0; i < 36; i++) {
        if (i === 8 || i === 13 || i === 18 || i === 23) {
            randomToken += '';
            continue;
        }
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomToken += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomToken;
};


app.use(express.static(__dirname + '/build'))
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
angular = {
    isDefined: function(query){
        return (typeof query !== 'undefined' && query !== null)
    },
    extend: require('node.extend')
}


var paths = {
    '/login': function(req, res){
        $log.info(req.body)
        var postData = req.body,
        user = userStorage[postData.username],
        newToken,
        tokenObj;
        $log.info(req.method, '->', req.url);

        if (angular.isDefined(user) && user.password === postData.password) {
            newToken = randomUUID();
            user.tokens.push(newToken);
            tokenStorage[newToken] = postData.username;
            localStorage.setItem('userStorage', JSON.stringify(userStorage));
            localStorage.setItem('tokenStorage', JSON.stringify(tokenStorage));

            $log.info([200, { name: user.name, userRole: user.userRole, token: newToken }, {}]);

            return [200, { name: user.name, userRole: user.userRole, token: newToken }, {}];
        } else {
            return [401, 'wrong combination username/password', {}];
        }

    },
    '/user':function(req, res){
        switch(req.method){
            case 'GET':{
                var queryToken, userObject;
                $log.info(req.method, '->', req.url);
                // if is present in a registered users array.
                if (queryToken = req.headers['x-token']) {
                    if (angular.isDefined(tokenStorage[queryToken])) {
                        userObject = userStorage[tokenStorage[queryToken]];
                        return [200, { token: queryToken, name: userObject.name, userRole: userObject.userRole }, {}];
                    } else {
                        return [401, 'auth token invalid or expired', {}];
                    }
                } else {
                    return [401, 'X-Token header must be set', {}];
                }
            };break;
            case 'POST':{
                $log.info(req.body)
                var postData = req.body,
                newUser,
                errors = [];
                $log.info(req.method, '->', req.url);

                if (angular.isDefined(userStorage[postData.username])) {
                    errors.push({ field: 'username', name: 'used' });
                }

                if (angular.isDefined(emailStorage[postData.email])) {
                    errors.push({ field: 'email', name: 'used' });
                }

                if (errors.length) {
                    return [409, {
                        valid: false,
                        errors: errors
                    }, {}];
                } else {
                    newUser = angular.extend(postData, { userRole: userRoles[postData.role], tokens: [] });
                    delete newUser.role;
                    delete newUser.password2;

                    userStorage[newUser.username] = newUser;
                    emailStorage[newUser.email] = newUser.username;
                    localStorage.setItem('userStorage', JSON.stringify(userStorage));
                    localStorage.setItem('emailStorage', JSON.stringify(emailStorage));
                    return [201, { valid: true, creationDate: Date.now() }, {}];
                }

            };break;
        }
    },
    '/logout': function(req, res){
        var queryToken, userTokens;
        $log.info(req.method, '->', req.url);

        if (queryToken = req.headers['x-token']) {
            if (angular.isDefined(tokenStorage[queryToken])) {
                userTokens = userStorage[tokenStorage[queryToken]].tokens;
                // Update userStorage AND tokenStorage
                userTokens.splice(userTokens.indexOf(queryToken));
                delete tokenStorage[queryToken];
                localStorage.setItem('userStorage', JSON.stringify(userStorage));
                localStorage.setItem('tokenStorage', JSON.stringify(tokenStorage));
                return [200, {}, {}];
            } else {
                return [401, 'auth token invalid or expired', {}];
            }
        } else {
            return [401, 'auth token invalid or expired', {}];
        }
    }
}

Object.keys(paths).forEach(function(path){
    app.use(path, function(req, res){
        var ret = paths[path](req, res)
        res.writeHead(ret[0], {'Content-Type':'application/json'});
        res.write(JSON.stringify(ret[1]));
        res.end()
    })
})
