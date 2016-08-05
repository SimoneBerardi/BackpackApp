angular.module("backpack.controllers.application", [])

.controller("ApplicationCtrl", function ($scope, $stateParams, $state, Session, Utility) {
    $scope.exit = function () {
        navigator.app.exitApp();
    }
})