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
    $scope.addCharacter = function () {
        $state.go("character-detail", { characterId: -1 });
    }
    $scope.modifyCharacter = function (character) {
        $state.go("character-detail", { characterId: character.Id });
    }
    $scope.deleteCharacter = function (character) {
        Session.deleteCharacter(character);
    }
})