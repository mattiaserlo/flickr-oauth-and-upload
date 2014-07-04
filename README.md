flickr-oauth-and-upload
=======================

Library that handles Flickr OAuth1.0 flow and photo upload.  
  
Managing the OAuth1.0 flow to authorize an application for uploading photos to Flickr can be complicated.  
This library aims at solving this. It covers the authorization process described on Flickr's developer page [https://www.flickr.com/services/api/auth.oauth.html](https://www.flickr.com/services/api/auth.oauth.html) , and offers an api for uploading photos.  
  
In future releases I will add more functionality like downloading photos etc.
  
## Installation

    npm install flickr-oauth-and-upload --save

## Usage

    var flickrApi = require('flickr-oauth-and-upload');  
  
To upload a photo, the following conditions must be fulfilled:  
- You (the developer) need to create a Flickr app, see the Flickr App Garden, [https://www.flickr.com/services/](https://www.flickr.com/services/). By doing this, Flickr will generate and show you a Flickr app consumer key (sometimes called api key) and a Flickr app consumer key secret (sometimes called api secret). You will need to pass in these strings to some of the apis in this library as described in the examples below.    
- You (the developer) need to aks the user to log in to Flickr and to authorize your app. In this authorization step, the user will review the permissions your app is requesting, and the user can accept or reject those.  
- You (the developer) need an authorized oauthToken and oauthTokenSecret that uniquely identifies the user you wish to upload photos on behalf of.  
  
If you have already gone through those steps, and you already have access to an authorized oauthToken and oauthTokenSecret, you can call the uploadPhoto api directly. If so, please jump ahead below to 'Example of calling uploadPhoto'. 
  
If you have not already gone through the authorization steps above, and/or you do not have access to an authorized oauthToken and oauthTokenSecret, this library offers help with that too. In this case, you should first call getRequestToken to get a request token. As a result, a url will be generated. You need to somehow ask the user to visit that url. The url will be served by Flickr and ask the user to log in to Flickr (if the user is not yet logged in) and will also ask the user to review your app's permission request. If the user approves, Flickr will redirect to the redirect url of your choice, and pass oauthToken and oauthVerifier as parameters to the url. You need to collect those two strings.  
  
Example of calling getRequestToken:  
  
    flickrApi.getRequestToken('YourFlickrConsumerKey',
                              'YourFlickrConsumerKeySecret',
                              'write', 'http://www.YourRedirectUrl.com/index.html',
                              function (err, obj) {
                                if (!err) {
                                  // Remember obj.oauthToken,
                                  // obj.oauthTokenSecret, obj.url
                                  // Ask the user to visit the url to authorize
                                  // your Flickr app
                                }
                              });
  
Next, you need to call useRequestTokenToGetAccessToken, passing in the oauthToken and oauthVerifier strings you retrieved from the steps described above. When the function has called Flickr and retrieved the authorized oauthToken and oauthSecret, your provided callback function will be called with parameters oauthToken and oauthSecret. After that, you can make authorized calls, using those credentials, to upload photos etc.
  
Example of calling useRequestTokenToGetAccessToken:

    // Here you need to pass in the oAuthToken, oAuthTokenSecret and oAuthVerifier that you collected from the redirect url above.  
    flickrApi.useRequestTokenToGetAccessToken('YourFlickrConsumerKey',
                                              'YourFlickrConsumerKeySecret',
                                              'ThisUsersOauthToken',
                                              'ThisUsersOauthTokenSecret',
                                              'ThisUsersOauthVerifier',
                                              function(err, obj) {
                                                if (!err) {
                                                  // Remember obj.oauthToken,
                                                  // obj.oauthTokenSecret,
                                                  // obj.userNsId, obj.userName
                                                }
                                              });
  
Example of calling uploadPhoto:  

    // Here you need to pass in the authorized oauthtoken and oauthtokensecret you received in the callback after calling useRequestTokenToGetAccessToken above  
    flickrApi.uploadPhoto('./myimage.jpg',
                          'YourFlickConsumerKey...',
                          'YourFlickConsumerKeySecret',
                          'authorizedOauthToken',
                          'authorizedOauthTokenSecret',
                          function (err, photoId) {
                            if (!err) {
                              console.log('uploaded photoId: ' + photoId);
                            }
                          }, {title: 'Title of the photo'});
  
## Notes / TODO

- If upload does not work, try checking the network configuration (ports, firewall, proxy) or test on another network. The app uses https (port 443) to call Flickr.
  
## Tests

npm test  
TODO write test cases

## License

BSD-2-Clause

## Release History

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

