angular.module("backpack.controllers.characters", [])

.controller("CharactersCtrl", function ($ionicPlatform, $scope, $state, Loader, Session) {
    Loader.show();
    $ionicPlatform.ready(function () {
        if (!Session.isInitialized) {
            Session.init().then(function () {
                $scope.characters = Session.characters;
                Loader.hide();
            })
        } else {
            $scope.characters = Session.characters;
            Loader.hide();
        }
    })

    $scope.select = function (character) {
        Loader.show();
        Session.selectCharacter(character)
        .then(function () {
            Loader.hide();
            $state.go("tabs.character");
        })
    }
    $scope.delete = function (character) {
        Utility.confirmDeleteCharacter(character, function () {
            Session.deleteCharacter(character);
        })
    }
})