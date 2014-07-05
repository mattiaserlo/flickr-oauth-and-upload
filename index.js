var fs = require('fs');
var https = require('https');
var crypto = require('crypto');
var FormData = require('form-data');
var querystring = require('querystring');
var percentEncode = require('oauth-percent-encode');

// TODO: how long sould nonce be?
var generateNonce = function () {
  var i;
  var nonce = '';
  for (i=0; i<8; i++) {
    nonce = nonce + Math.floor(Math.random()*10);
  }
  return nonce;
};

var generateTimestamp = function () {
  var date = new Date();
  var millisec = date.getTime();
  return String(Math.floor(millisec/1000));
};

var findStringBetween = function (fullString, beforeString, afterString) {
  var beforeStringIndex = fullString.indexOf(beforeString) + beforeString.length;
  if (beforeStringIndex >= 0) {
    var searchString = fullString.substring(beforeStringIndex, fullString.length);
    var afterStringIndex = searchString.indexOf(afterString);
    if (afterStringIndex < 0) {
      afterStringIndex = searchString.length;
    }
    return searchString.substring(0, afterStringIndex);
  }
  return null;
};

var percentEncodeTwice = function (string) {
  var encodedString = percentEncode(string);
  return percentEncode(encodedString);
};

var createSignature = function (message, key) {
  var hmac = crypto.createHmac('sha1', key);
  var hash2 = hmac.update(message);
  var signature = hmac.digest(encoding='base64');
  signature = querystring.escape(signature);
  return signature;
};

var createSortedKeyValuePairString = function ( preString, args, keyValueSeparator,
                                                keySeparator, convertFunc) {
  var prop;
  var sortedKeys = [];
  var keyValuePairString = preString;
  var pushString;

  for (prop in args) {
    sortedKeys.push(prop);
  }

  sortedKeys.sort();

  for (var i=0; i<sortedKeys.length; i++) {
    if (convertFunc) {
      pushString = convertFunc(args[sortedKeys[i]]);
    } else {
      pushString = args[sortedKeys[i]];
    }
    keyValuePairString += sortedKeys[i] + keyValueSeparator + pushString;
    if (i < sortedKeys.length-1) {
      keyValuePairString += keySeparator;
    }
  }
  return keyValuePairString;
};

/**
 * Generic function for calling any of the API methods (except photo upload)
 * listed on Flickr's page, https://www.flickr.com/services/api/
 * For photo upload, use the specific api photoUpload below.
 *
 * args should be a JavaScript object containing any method arguments you
 * wish to pass to the Flickr method. You do not have to pass in any
 * user or app credentials, or any format type.
 *
 * When the function has finished, the callback you provided will be called,
 * with two arguments, error and data. For a successful call, error will be
 * null and data will be a JavaScript object representing the response from
 * Flickr. You do not have to set the format type by yourself.
 */
var callApiMethod = function (methodName,
                              flickrConsumerKey, flickrConsumerKeySecret,
                              oauthToken, oauthTokenSecret, callback, args) {

  var parameters = {
    oauth_nonce: generateNonce(),
    format: 'json',
    oauth_consumer_key : flickrConsumerKey,
    oauth_timestamp : generateTimestamp(),
    oauth_signature_method : 'HMAC-SHA1',
    oauth_version : '1.0',
    oauth_token : oauthToken,
    method: methodName,
    format: 'json',
    nojsoncallback: '1'
  };

  if (args) {
    for (prop in args) {
      parameters[prop] = args[prop];
    }
  }

  var cryptoMessage = createSortedKeyValuePairString('POST&https%3A%2F%2F' +
                                    'api.flickr.com%2Fservices%2Frest',
                                    parameters, '%3D', '%26', percentEncodeTwice);

  var cryptoKey = flickrConsumerKeySecret + '&' + oauthTokenSecret;
  var signature = createSignature(cryptoMessage, cryptoKey);
  var parameterString = createSortedKeyValuePairString('', parameters, '=', '&',
                                                        percentEncode);

  parameterString += '&oauth_signature=' + signature;

  var path = '/services/rest';

  var httpsOptions = {
    hostname: 'api.flickr.com',
    port: 443,
    path: path + '?' + parameterString,
    method: 'POST'
  };

  var data = '';
  var req = https.request(httpsOptions, function(res) {
    // console.log('https request statusCode: ', res.statusCode);
    res.on('data', function(d) {
      data += d;
    });

    res.on('end', function() {
      if (callback && (callback instanceof Function)) {
        data = JSON.parse(data);
        callback(null, data);
      }
    });
  });
  req.end();

  req.on('error', function(e) {
    console.error(e);
    if (callback && (callback instanceof Function)) {
      callback(new Error('Error: ' + e));
    }
  });
};

/**
 * This function takes a filename (it should be the full path to a photo on the
 * file system of the computer this program is running on), and uploads that photo
 * to Flickr.
 *
 * When the function has uploaded the photo, the callback you provided will be
 * called, with two arguments, error and photoId. For a successful upload, error
 * will be null and photoId will be the Flickr photo id that uniquely
 * identifies your new photo.
 *
 * Note that to call this function, the user needs to have authorized your Flickr
 * app, and you need to have access to oauth_token and oauth_token_secret.
 * If the user has not already authorized your app, and/or you do not already have
 * access to oauth_token and oauth_secret, you need to first get a request token.
 * See documentation for getRequestToken further down below.
 *
 * optionalArgs: this is an optional JS object containing any of the following
 * key/value pairs (specified by Flickr):
 *   title (optional) The title of the photo.
 *   description (optional) A description of the photo. May contain some limited
 *      HTML.
 *   tags (optional) A space-seperated list of tags to apply to the photo.
 *   is_public, is_friend, is_family (optional) Set to 0 for no, 1 for yes.
 *      Specifies who can view the photo.
 *   safety_level (optional) Set to 1 for Safe, 2 for Moderate, or 3 for
 *      Restricted.
 *   content_type (optional) Set to 1 for Photo, 2 for Screenshot, or 3 for Other.
 *   hidden (optional) Set to 1 to keep the photo in global search results, 2 to
 *      hide from public searches.
 */
var uploadPhoto = function (filename, flickrConsumerKey, flickrConsumerKeySecret,
                            oauthToken, oauthTokenSecret, callback, optionalArgs) {
  var parameters = {
    oauth_nonce : generateNonce(),
    oauth_timestamp : generateTimestamp(),
    oauth_consumer_key : flickrConsumerKey,
    oauth_signature_method : 'HMAC-SHA1',
    oauth_version : '1.0',
    oauth_token : oauthToken
  };

  if (optionalArgs) {
    for (prop in optionalArgs) {
      parameters[prop] = optionalArgs[prop];
    }
  }

  var cryptoMessage = createSortedKeyValuePairString('POST&https%3A%2F%2F' +
                                    'up.flickr.com%2Fservices%2Fupload%2F&',
                                    parameters, '%3D', '%26', percentEncodeTwice);

  var cryptoKey = flickrConsumerKeySecret + '&' + oauthTokenSecret;
  var signature = createSignature(cryptoMessage, cryptoKey);
  var parameterString = createSortedKeyValuePairString('', parameters, '=', '&',
                                                        percentEncode);

  parameterString += '&oauth_signature=' + signature;

  var form = new FormData();

  for (var prop in parameters) {
    form.append(prop, parameters[prop]);
  }
  form.append('photo', fs.createReadStream(filename));

  form.getLength(function (err, length) {
    if (err) return;

    var path = '/services/upload/';

    var httpsOptions = {
      hostname: 'up.flickr.com',
      port: 443,
      path: path + '?' + parameterString,
      method: 'POST',
      headers: {
        'content-length': length,
        'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
      }
    };

    var req = https.request(httpsOptions, function(res) {
      // console.log('upload statusCode: ', res.statusCode);
      res.on('data', function(d) {
        //console.log('upload result: ' + d);
        /* for example
        upload statusCode:  200
        upload result: <?xml version="1.0" encoding="utf-8" ?>
        <rsp stat="ok">
        <photoid>14369421238</photoid>
        </rsp>
        */
        var photoId = findStringBetween(String(d), '<photoid>', '</photoid>');
        // console.log('found photo Id: ' + photoId);
        if (callback && (callback instanceof Function)) {
          if (photoId) {
            // console.log('calling callback with photoId ' + photoId);
            callback(null, photoId);
          } else {
            callback(new Error('Upload error: ' + d));
          }
        }
      });
    });
    form.pipe(req);
    req.end();

    req.on('error', function(e) {
      console.error(e);
      if (callback && (callback instanceof Function)) {
        callback(new Error('Upload error: ' + e));
      }
    });
  });
};

/**
 * This function calls the 'getPhotos' Flickr api to get a number of photos
 * from a particular user. If userId is set to 'me' it will refer to the
 * logged in user.
 * 
 * optionalArgs is an optional JS object that can contain any of the optional
 * arguments listed by Flickr. You do not have to pass in any user or app
 * credentials in this object.
 *
 * The response format will be json. You do not have to pass in any format
 * parameter yourself.
 *
 * For more info about the getPhotos Flickr api, see:
 * https://www.flickr.com/services/api/flickr.people.getPhotos.html
 */
var getPhotos = function (  userId, flickrConsumerKey, flickrConsumerKeySecret,
                            oauthToken, oauthTokenSecret,
                            callback, optionalArgs) {
  var parameters = {
    oauth_nonce: generateNonce(),
    format: 'json',
    oauth_consumer_key : flickrConsumerKey,
    oauth_timestamp : generateTimestamp(),
    oauth_signature_method : 'HMAC-SHA1',
    oauth_version : '1.0',
    oauth_token : oauthToken,
    method: 'flickr.people.getPhotos',
    user_id: userId,
    nojsoncallback: '1'
  };

  if (optionalArgs) {
    for (prop in optionalArgs) {
      parameters[prop] = optionalArgs[prop];
    }
  }

  var cryptoMessage = createSortedKeyValuePairString('POST&https%3A%2F%2F' +
                                    'api.flickr.com%2Fservices%2Frest',
                                    parameters, '%3D', '%26', percentEncodeTwice);

  var cryptoKey = flickrConsumerKeySecret + '&' + oauthTokenSecret;
  var signature = createSignature(cryptoMessage, cryptoKey);
  var parameterString = createSortedKeyValuePairString('', parameters, '=', '&',
                                                        percentEncode);

  parameterString += '&oauth_signature=' + signature;

  var path = '/services/rest';

  var httpsOptions = {
    hostname: 'api.flickr.com',
    port: 443,
    path: path + '?' + parameterString,
    method: 'POST'
  };

  var data = '';
  var req = https.request(httpsOptions, function(res) {
    // console.log('https request statusCode: ', res.statusCode);
    res.on('data', function(d) {
      data += d;
    });

    res.on('end', function() {
      if (callback && (callback instanceof Function)) {
        data = JSON.parse(data);
        callback(null, data);
      }
    });
  });
  req.end();

  req.on('error', function(e) {
    console.error(e);
    if (callback && (callback instanceof Function)) {
      callback(new Error('Error: ' + e));
    }
  });
};

/**
 * After the user has authorized your Flickr app, you need to convert the
 * request token to an access token, so that you can make api calls.
 * This function should be called after you have called getRequestToken, and
 * after you have asked the user to authorize your Flickr app. (See
 * getRequestToken documentation further down below.)
 * When the function has called Flickr and retrieved the oauth_token and
 * oauth_secret, your provided callback function will be called with
 * parameters oauth_token and oauth_secret.
 * After that, you can make authorized calls, using those credentials, to
 * upload photos etc.
 * Note that if you already have oauth_token and oauth_secret, and if the user
 * already has authorized your app, you don't need to call this function.
 * Instead you can call for example uploadPhoto directly.
 */
var useRequestTokenToGetAccessToken = function (flickrConsumerKey,
                                                flickrConsumerKeySecret,
                                                oauthToken, oauthTokenSecret,
                                                oauthVerifier, callback) {  
  var oauthToken = String(oauthToken);
  var oauthTokenSecret = String(oauthTokenSecret);
  var oauthVerifier = String(oauthVerifier);

  var parameters = {
    oauth_nonce : generateNonce(),
    oauth_timestamp : generateTimestamp(),
    oauth_verifier : oauthVerifier,
    oauth_consumer_key : flickrConsumerKey,
    oauth_signature_method : 'HMAC-SHA1',
    oauth_version : '1.0',
    oauth_token : oauthToken
  };

  var cryptoMessage = createSortedKeyValuePairString('GET&https%3A%2F%2F' + 
                                    'www.flickr.com%2Fservices%2Foauth%2Faccess_token&',
                                    parameters, '%3D', '%26', percentEncodeTwice);

  var cryptoKey = flickrConsumerKeySecret + '&' + oauthTokenSecret;
  var signature = createSignature(cryptoMessage, cryptoKey);

  var parameterString = createSortedKeyValuePairString('', parameters, '=', '&',
                                                        percentEncode);

  parameterString += '&oauth_signature=' + signature;

  var path = '/services/oauth/access_token';
  var httpsOptions = {
    hostname: 'www.flickr.com',
    port: 443,
    path: path + '?' + parameterString,
    method: 'GET'
  };

  var req = https.request(httpsOptions, function(res) {
    res.on('data', function(d) {
      // console.log('useRequestTokenToGetAccessToken data: ' + d);
      var str = String(d);

      var oauthToken = findStringBetween(str, 'oauth_token=', '&');
      var oauthTokenSecret = findStringBetween(str, 'oauth_token_secret=', '&');
      var userNsid = findStringBetween(str, 'user_nsid=', '&');
      var userName = findStringBetween(str, 'username=', '&');
      var fullName = findStringBetween(str, 'fullname=', '&');

      /*
      Example:
      oauthToken: 72...
      oauthTokenSecret: 4b...
      userNsId: 73...
      userName: Mattias%20Erl%C3%B6
      */
      if (callback && (callback instanceof Function)) {
        callback(null, {oauthToken: oauthToken,
                        oauthTokenSecret: oauthTokenSecret,
                        userNsId: userNsId,
                        userName: userName});
      }
    });
  });
  req.end();

  req.on('error', function(e) {
    console.log('useRequestTokenToGetAccessToken error!');
    console.error(e);
    if (callback && (callback instanceof Function)) {
      callback(new Error('useRequestTokenToGetAccessToken error: ' + e));
    }
  });
};

/**
 * To be able to make Flickr API calls, the user needs to authorize your
 * Flickr app, and you need oauth_token and oauth_token_secret.
 * If you do not already have those credentials, you can call this function.
 * permissions should be 'write' if you want to be able to upload.
 * This function will call Flickr to get a request token.
 * After the function has called Flickr, the callback function you provided
 * will be called, with the following parameters:
 *   oauthToken, oauthTokenSecret, url
 * The url is a Flickr url where the user will be asked to log in to Flickr
 * and review and approve the permissions you asked for here. If the user
 * accepts it, Flickr will redirect the user to the redirect url you provide
 * here. In the redirection, the redirect url will contain parameters for
 * oauth_token and oauth_verifier, for example:
 * http://www.example.com/?oauth_token=72...&oauth_verifier=5d...
 * You need to catch those parameters because you need to provide them for
 * exchanging the request token to an authorized access token.
 */
var getRequestToken = function (flickrConsumerKey, flickrConsumerKeySecret,
                                permissions, redirectUrl, callback) {
  var parameters = {
    oauth_nonce : generateNonce(),
    oauth_timestamp : generateTimestamp(),
    oauth_consumer_key : flickrConsumerKey,
    oauth_signature_method : 'HMAC-SHA1',
    oauth_version : '1.0',
    oauth_callback : redirectUrl
  };

  var cryptoMessage = createSortedKeyValuePairString('GET&https%3A%2F%2F' + 
                                    'www.flickr.com%2Fservices%2Foauth%2Frequest_token&',
                                    parameters, '%3D', '%26', percentEncodeTwice);

  var cryptoKey = flickrConsumerKeySecret + '&';
  var signature = createSignature(cryptoMessage, cryptoKey);
  
  var parameterString = createSortedKeyValuePairString('', parameters, '=', '&',
                                                        percentEncode);

  parameterString += '&oauth_signature=' + signature;

  var path = '/services/oauth/request_token';
  var httpsOptions = {
    hostname: 'www.flickr.com',
    port: 443,
    path: path + '?' + parameterString,
    method: 'GET'
  };

  var req = https.request(httpsOptions, function(res) {
    // console.log('getRequestToken statusCode: ', res.statusCode);

    res.on('data', function(d) {
      // console.log('getRequestToken data: ' + d);
      var str = String(d);
      var oauthToken = findStringBetween(str, 'oauth_token=', '&');
      var oauthTokenSecret = findStringBetween(str, 'oauth_token_secret=', '&');

      var url = 'https://www.flickr.com/services/oauth/authorize?oauth_token=' +
          oauthToken + '&perms=' + permissions;

      if (callback && (callback instanceof Function)) {
        callback(null, {oauthToken: oauthToken, 
                        oauthTokenSecret: oauthTokenSecret,
                        url: url});
      }
    });
  });

  req.end();

  req.on('error', function(e) {
    console.log('getRequestToken error!');
    console.error(e);
    if (callback && (callback instanceof Function)) {
      callback(new Error('getRequestToken error: ' + e));
    }
  });
};

exports.getRequestToken = getRequestToken;
exports.useRequestTokenToGetAccessToken = useRequestTokenToGetAccessToken;
exports.uploadPhoto = uploadPhoto;
exports.getPhotos = getPhotos;
exports.callApiMethod = callApiMethod;
