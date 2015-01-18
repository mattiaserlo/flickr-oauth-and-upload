flickr-oauth-and-upload
=======================

Library that handles Flickr OAuth1.0 flow and photo upload, and calling any Flickr api method.  
  
Managing the OAuth1.0 flow to authorize an application for uploading photos to Flickr can be complicated.  
This library aims at solving this. It covers the authorization process described on Flickr's developer page [https://www.flickr.com/services/api/auth.oauth.html](https://www.flickr.com/services/api/auth.oauth.html) , and offers an api for uploading photos, and a generic api for calling any Flickr api method. 
  
## Installation

    npm install flickr-oauth-and-upload --save

## Usage

    var flickrApi = require('flickr-oauth-and-upload');  
  
To upload a photo, the following conditions must be fulfilled:  
- You (the developer) need to create a Flickr app, see the Flickr App Garden, [https://www.flickr.com/services/](https://www.flickr.com/services/). By doing this, Flickr will generate and show you a Flickr app consumer key (sometimes called api key) and a Flickr app consumer key secret (sometimes called api secret). You will need to pass in these strings to some of the apis in this library as described in the examples below.    
- You (the developer) need to aks the user to log in to Flickr and to authorize your app. In this authorization step, the user will review the permissions your Flickr app is requesting, and the user can accept or reject those.  
- You (the developer) need an authorized oauthToken and oauthTokenSecret that uniquely identifies the user you wish to upload photos on behalf of.  
  
If you have already gone through those steps, and you already have access to an authorized oauthToken and oauthTokenSecret, you can call the authorized apis (uploadPhoto or callApiMethod) directly. If so, please jump ahead below to 'Example of calling uploadPhoto' or 'Example of calling callApiMethod'. 
  
If you have not already gone through the authorization steps above, and/or you do not have access to an authorized oauthToken and oauthTokenSecret, this library offers help with that. In this case, you should first call getRequestToken to get a request token. As a result, a url will be generated.  
  
Example of calling getRequestToken:  
  
    var myCallback = function (err, data) {
      if (!err) {
        console.log('Remember the credentials:');
        console.log('oauthToken: ' + data.oauthToken);
        console.log('oauthTokenSecret: ' + data.oauthTokenSecret);
        console.log('Ask user to go here for authorization: ' + data.url);
      } else {
        console.log('Error: ' + err);
      }
    };
    
    var args = {
      flickrConsumerKey: '42...',
      flickrConsumerKeySecret: 'aa...',
      permissions: 'write',
      redirectUrl: 'http://www.redirecturl...',
      callback: myCallback
    };
    
    flickrApi.getRequestToken(args);

Next, as you see in the callback above, you need to somehow ask the user to visit that url. The url will be served by Flickr and ask the user to log in to Flickr (if not already logged in) and will ask the user to review your app's permission request. If the user approves, Flickr will redirect the browser to the redirect url of your choice, and pass oauth_token and oauth_verifier as parameters to the url. You need to collect and remember those two strings.  
  
Next, you need to call useRequestTokenToGetAccessToken, passing in the oauth_token and oauth_verifier strings you retrieved from the steps described above. By doing this you will receive authorized versions of oauth token and oauth token secret. You should store or remember those credentials since they are needed later for making authorized api calls like uploading photos or calling other api methods.  
    
Example of calling useRequestTokenToGetAccessToken:
  
    var myCallback = function (err, data) {
      if (!err) {
        // Now we have received authorized versions of
        // oauth token and oauth token secret
        console.log('oauthToken: ' + data.oauthToken);
        console.log('oauthTokenSecret: ' + data.oauthTokenSecret);
        console.log('userNsId: ' + data.userNsId);
        console.log('userName: ' + data.userName);
        console.log('fullName: ' + data.fullName);
      } else {
        console.log('error: ' + err);
      }
    };
    
    var args = {
      flickrConsumerKey: '42...',
      flickrConsumerKeySecret: 'aa...',
      oauthToken: '99...',
      oauthTokenSecret: '3c...',
      oauthVerifier: 'd7...',
      callback: myCallback
    };
    
    flickrApi.useRequestTokenToGetAccessToken(args);
  
  
Example of calling uploadPhoto:  

Here you need to pass in the authorized oauth token and oauth token secret, which you either received in the callback after calling useRequestTokenToGetAccessToken above, or have stored from before.  
  
The optionalArgs object is an optional object containing any of the key/value pair arguments used by Flickr as described on https://www.flickr.com/services/api/upload.api.html  
Note that you do not have to pass in any photo reference in the optional arguments object.  
  
    var myCallback = function (err, photoId) {
      if (!err) {
        console.log('uploaded photoId: ' + photoId);
      }
    };
     
    var args = {
      path: './myimage.jpg',
      flickrConsumerKey: '42...',
      flickrConsumerKeySecret: 'aa...',
      oauthToken: '99...',
      oauthTokenSecret: '1b...',
      callback: myCallback,
      optionalArgs: {title: 'Title of the photo'}
    };
 
    flickrApi.uploadPhoto(args);
  
Example of calling callApiMethod, to call any Flickr api method:
  
This is a generic function for calling any of the API methods (except photo upload) listed on Flickr's page, https://www.flickr.com/services/api/  
For photo upload, use the specific api photoUpload instead.  
  
The optionalArgs object is an optional object that can contain any method arguments you wish to pass to the Flickr method. Note that you do not have to pass in any user or app credentials, or any format type, here.  
  
When the function has finished, the callback you provided will be called, with two arguments, error and data. For a successful call, error will be null and data will be a JavaScript object representing the response from Flickr. You do not have to set the format type by yourself.  
  
    // Get list of Nikon cameras
    
    var myCallback = function (err, data) {
      if (!err) {
        // Got result in data object
        // Iterate through the properties
        for (var prop in data) {
          console.log('prop: ' + prop);
        }        
      }
    };
     
    var args = {
      method: 'flickr.cameras.getBrandModels',
      flickrConsumerKey: '42...',
      flickrConsumerKeySecret: 'aa...',
      oauthToken: '99...',
      oauthTokenSecret: '1b...',
      callback: myCallback,
      optionalArgs : {brand: 'Nikon'}
    };
    
    flickrApi.callApiMethod(args);
  
## Notes / TODO

- If upload does not work, try checking the network configuration (ports, firewall, proxy) or test on another network. The app uses https (port 443) to call Flickr.
  
## Tests

npm test  
TODO write test cases

## License

BSD-2-Clause

## Release History

* 0.8.0 Bugfix: callback argument was not properly considered
* 0.7.0 Offer signing as a separate function, signApiMethod
* 0.6.0 Changed function arguments, now functions take objects as input
* 0.5.1 Improved documentation
* 0.5.0 Added callApiMethod function and bugfixed response format from getPhotos
* 0.4.1 Removed unnecessary logs
* 0.4.0 Tidied up some code, and updated api parameter order
* 0.3.0 Added basic support for getPhotos
* 0.2.1 Bugfix: type error when handling uploadPhoto response
* 0.2.0 Added callback to uploadPhoto function
* 0.1.6 Updated README with notes
* 0.1.5 Updated README with notes
* 0.1.4 Updated README with notes
* 0.1.3 Bugfix: did not export all necessary functions
* 0.1.2 Updated README with more explanations
* 0.1.1 Fixed dependencies
* 0.1.0 Initial release

