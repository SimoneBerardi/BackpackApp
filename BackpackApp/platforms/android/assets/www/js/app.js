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
    "backpack.controllers.itemdetail",
    "backpack.controllers.bagdetail",
    "backpack.controllers.application",
    "backpack.controllers.characterdetail",
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
        //IsDebugging
        if (window.parent && window.parent.ripple)
            Utility.isDebugging = true;
    });
})

.config(function ($stateProvider, $ionicConfigProvider, $urlRouterProvider) {
    $ionicConfigProvider.tabs.position('bottom');

    $stateProvider
    .state("characters", {
        url: "/characters",
        templateUrl: "templates/characters.html",
        controller: "CharactersCtrl",
    })
    .state("character-detail", {
        url: "/character-detail:characterId",
        templateUrl: "templates/character-detail.html",
        controller: "CharacterDetailCtrl",
    })

    .state("tabs", {
        url: "/tabs",
        abstract: true,
        templateUrl: "templates/tabs.html",
        controller: "ApplicationCtrl"
    })
    .state("tabs.character", {
        cache: false,
        url: "/character",
        views: {
            "tab-character": {
                templateUrl: "templates/tab-character.html",
                controller: "TabCharacterCtrl"
            }
        },
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
    .state("tabs.items-item-detail", {
        url: "/item-detail/:itemId?isEdit",
        views: {
            "tab-items": {
                templateUrl: "templates/item-detail.html",
                controller: "ItemDetailCtrl"
            }
        }
    })
    .state("tabs.inventory-item-detail", {
        url: "/item-detail/:itemId",
        views: {
            "tab-inventory": {
                templateUrl: "templates/item-detail.html",
                controller: "ItemDetailCtrl"
            }
        }
    })
    .state("tabs.bag-detail", {
        url: "/bag-detail/:bagId",
        views: {
            "tab-inventory": {
                templateUrl: "templates/bag-detail.html",
                controller: "BagDetailCtrl"
            }
        }
    })

    $urlRouterProvider.otherwise('/characters');
})
