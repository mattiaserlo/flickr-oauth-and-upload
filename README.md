flickr-oauth-and-upload
=======================

Library that handles Flickr OAuth1.0 flow and photo upload.  
  
Managing the OAuth1.0 flow to authorize an application for uploading photos to Flickr can be complicated. This library aims at solving this. It covers the authorization process described on Flickr's developer page https://www.flickr.com/services/api/auth.oauth.html , and offers an api for uploading photos.  
  
In future releases I will add more functionality like downloading photos etc.
  
## Installation

  npm install flickr-oauth-and-upload --save

## Usage

  var flickrApi = require('flickr-oauth-and-upload');  
  
  To upload a photo, the following conditions must be fulfilled:  
    * You (the developer) need to create a Flickr app, see the Flickr App Garden, https://www.flickr.com/services/
    * You (the developer) need to aks the user to log in to Flickr and to authorize your app. In this authorization step, the user will review the permissions your app is requesting, and the user can accept or reject those.
    * You (the developer) need an authorized oauth_token and oauth_token_secret that uniquely identifies the user you wish to upload photos on behalf of.
  
  If you have already gone through those steps, and you already have access to an authorized oauth_token and oauth_token_secret, you can call the uploadPhoto api directly. If so, please jump ahead below to 'Example of calling uploadPhoto'. 
  
  If you have not already gone through the authorization steps above, and/or you do not have access to an authorized oauth_token and oauth_token_secret, this library offers help with that. In this case, you should first call getRequestToken to get a request token. As a result, a url will be generated. You need to somehow ask the user to visit that url. The url will be served by Flickr and ask the user to log in to Flickr (if the user is not yet logged in) and will also ask the user to review your app's permission request. If the user approves, Flickr will redirect to the redirect url of your choice, and pass oauth_token and oauth_verifier as parameters to the url. You need to collect those two strings.  
  
  Example of calling getRequestToken:  
  
  flickrApi.getRequestToken('YourFlickrConsumerKey', 'YourFlickrConsumerKeySecret',
                            'write', 'http://www.YourRedirectUrl.com/index.html',
                            function (oAuthToken, oAuthTokenSecret, url) {
                              // Ask the user to visit the url to authorize your Flickr app
                            });
  
  Next, you need to call useRequestTokenToGetAccessToken, passing in the oauth_token and oauth_verifier strings you retrieved above. When the function has called Flickr and retrieved the authorized oauth_token and oauth_secret, your provided callback function will be called with parameters oauth_token and oauth_secret. After that, you can make authorized calls, using those credentials, to upload photos etc.
  
  Example of calling useRequestTokenToGetAccessToken:

  // Here you need to pass in the oAuthToken, oAuthTokenSecret and oAuthVerifier that you collected from the redirect url above.  
  flickrApi.useRequestTokenToGetAccessToken('YourFlickrConsumerKey', 'YourFlickrConsumerKeySecret',
                                            'ThisUsersOauthToken', 'ThisUsersOauthTokenSecret',
                                            'ThisUsersOauthVerifier',
                                            function(oauthToken, oauthTokenSecret) {
                                              // Remember these strings
                                            });
  Example of calling uploadPhoto:  

  // Here you need to pass in the authorized oAuthToken and oAuthTokenSecret you received in the callback after calling useRequestTokenToGetAccessToken above  
  flickrApi.uploadPhoto('./myimage.jpg',
                        'YourFlickConsumerKey...', 'YourFlickConsumerKeySecret',
                        'ThisUsersAuthorizedOauthToken', 'ThisUsersAuthorizedOauthTokenSecret',
                        {title: 'Title of the photo'});
  
## Tests

  npm test  
  TODO write test cases

## License

  BSD-2-Clause

## Release History

* 0.1.1 Fixed dependencies
* 0.1.0 Initial release

