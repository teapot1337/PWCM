// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('contentReceiver', ['ionic', 'ionic.contrib.ui.cards'])

  .run(function ($ionicPlatform, $rootScope, $http) {
    $ionicPlatform.ready(function () {
      if (window.cordova && window.cordova.plugins) {
        if (window.cordova.plugins.Keyboard) {
          console.log("Updating keyboard settings (Hide keyboard, disable scroll)")

          // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
          // for form inputs)
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

          // Don't remove this line unless you know what you are doing. It stops the viewport
          // from snapping when text inputs are focused. Ionic handles this internally for
          // a much nicer keyboard experience.
          cordova.plugins.Keyboard.disableScroll(true);
        }

        if (window.cordova.plugins.notification) {
          console.log("Requesting notification permission");
          window.cordova.plugins.notification.local.promptForPermission();
        }

        if (window.cordova.plugins.locationManager) {
          console.log("Requesting Location Permission");
          cordova.plugins.locationManager.requestAlwaysAuthorization();

          console.log("Location Manager enabled. Will begin ranging for beacons");
          var delegate = new window.cordova.plugins.locationManager.Delegate();

          delegate.didDetermineStateForRegion = function (pluginResult) {
            console.log('didDetermineStateForRegion: ' + JSON.stringify(pluginResult));
          };

          delegate.didExitRegion = function (pluginResult) {
            console.log('didExitRegion: ' + JSON.stringify(pluginResult));
          };

          delegate.didEnterRegion = function (pluginResult) {
            console.log('didEnterRegion: ' + JSON.stringify(pluginResult));
          };

          delegate.didStartMonitoringForRegion = function (pluginResult) {
            console.log('didStartMonitoringForRegion:', pluginResult);
          };

          cordova.plugins.locationManager.setDelegate(delegate);

          // Get beacons from the server
          console.log("Requesting beacons from server");
          var url = "http://localhost:5000/api/Beacon";
          $http.get(url).success(function (response) {
            console.log("Response recieved from server");
            console.log(JSON.stringify(response));
            response.forEach(function (element) {
              console.log("Registering beacon " + element.name);
              var id = element.name;
              var uuid = element.id.toString();
              var region = new cordova.plugins.locationManager.BeaconRegion(id, uuid, 0, 0);

              cordova.plugins.locationManager.startMonitoringForRegion(region)
                .fail(console.error)
                .done();

              cordova.plugins.locationManager.startRangingBeaconsInRegion(region)
                .fail(console.error)
                .done();
            }, this);
          });
        }
      }

      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  })

  .controller('CardsCtrl', function ($scope, $http) {
    $scope.cards = [];

    console.log("locading CardsCtrl");

    $scope.getSavedCards = function () {
      return readCache().cards;
    }

    $scope.loadSavedCards = function () {
      // Retrieve the saved cards from device
      var cards = $scope.getSavedCards();
      for (cardIndex in cards) {
        $scope.displayCard(cards[cardIndex]);
      }
    }

    $scope.displayCard = function (card) {
      $scope.cards.unshift(angular.extend({}, card));
    }

    $scope.addCard = function (content, name, requestDateTime, locationName) {
      console.log("addCard: New card to be added.")
      var card = { id: Math.random(), htmlContent: content, title: name, dateTime: requestDateTime, location: locationName };
      console.log("addCard: New card values are " + JSON.stringify(card));

      console.log("addCard: Display card");
      $scope.displayCard(card);

      console.log("Saving a new card to device");

      // Cards are added to array and storage now
      updateCards($scope.cards);
    }

    $scope.getCardFromServer = function (beaconId) {
      console.log("getCardFromServer: Attempting to retrieve content for beacon UUID: " + beaconId);

      var url = "http://localhost:5000/api/Schedule?locationId=" + beaconId;
      $http.get(url).success(function (response) {
        console.log("getCardFromServer: Response recieved from server")
        console.log(response); 
        console.log("getCardFromServer: Response is " + JSON.stringify(response));
        response.forEach(function (element) {
          console.log("getCardFromServer: Parsing a response");
          console.log("getCardFromServer: Response has description: " + element.contentShortDescription);
          $scope.addCard(element.content, element.contentShortDescription, element.RequestDateTime, element.locationName);
        }, this);
      });
    }

    $scope.getCardFromServer("74278BDA-B644-4520-8F0C-720EAF059935");
    $scope.loadSavedCards();

    $scope.cardDestroyed = function (index) {
      $scope.cards.splice(index, 1);
    };

    console.log("CardsCntrl loaded");
  })

  .controller('CardCtrl', function ($scope, $ionicSwipeCardDelegate) {
    $scope.doAnything = function () {
      var card = $ionicSwipeCardDelegate.getSwipeableCard($scope);
      card.swipe();
    };
  })