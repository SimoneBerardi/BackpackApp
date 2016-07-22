angular.module("backpack.controllers.characters", [])

.controller("CharactersCtrl", function ($scope, $state, Loader, Session) {
    if (!Session.isInitialized) {
        Loader.show();
        Session.init().then(function () {
            $scope.characters = Session.characters;
            Loader.hide();
        })
    } else
        $scope.characters = Session.characters;

    $scope.select = function (character) {
        Loader.show();
        Session.selectCharacter(character)
        .then(function () {
            Loader.hide();
            $state.go("tabs.character");
        })
    }
})