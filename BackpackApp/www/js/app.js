// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic',
    //Extensions
    "backpack.extensions",
    //Directives
    "backpack.directives",
    //Controllers
    "backpack.controllers.popup",
    "backpack.controllers.characters",
    "backpack.controllers.tabcharacter",
    "backpack.controllers.tabinventory",
    "backpack.controllers.tabitems",
    //Services
    "backpack.services.utility",
    "backpack.services.loader",
    "backpack.services.database",
    "backpack.services.session"])

.run(function ($ionicPlatform, Utility) {
    $ionicPlatform.ready(function () {
        if (cordova.platformId === 'ios' && window.cordova && window.cordova.plugins.Keyboard) {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

            // Don't remove this line unless you know what you are doing. It stops the viewport
            // from snapping when text inputs are focused. Ionic handles this internally for
            // a much nicer keyboard experience.
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
})

.config(function ($stateProvider, $ionicConfigProvider, $urlRouterProvider) {
    $ionicConfigProvider.tabs.position('top');

    $stateProvider
    .state("characters", {
        url: "/characters",
        templateUrl: "templates/characters.html",
        controller: "CharactersCtrl",
    })

    .state("tabs", {
        url: "/tabs",
        abstract: true,
        templateUrl: "templates/tabs.html"
    })
    .state("tabs.character", {
        url: "/character",
        views: {
            "tab-character": {
                templateUrl: "templates/tab-character.html",
                controller: "TabCharacterCtrl"
            }
        }
    })
    .state("tabs.inventory", {
        url: "/inventory",
        views: {
            "tab-inventory": {
                templateUrl: "templates/tab-inventory.html",
                controller: "TabInventoryCtrl"
            }
        }
    })
    .state("tabs.items", {
        url: "/items",
        views: {
            "tab-items": {
                templateUrl: "templates/tab-items.html",
                controller: "TabItemsCtrl"
            }
        }
    })

    $urlRouterProvider.otherwise('/characters');
})
