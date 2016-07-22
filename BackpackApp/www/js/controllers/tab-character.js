angular.module("backpack.controllers.tabcharacter", [])

.controller("TabCharacterCtrl", function ($scope, $state, Loader, Session) {
    $scope.character = Session.character;
})