angular.module("backpack.controllers.characterdetail", [])

.controller("CharacterDetailCtrl", function ($scope, $stateParams, $state, Session, Utility) {
    $scope.sizes = Utility.sizes;
    $scope.character = {};
    $scope.characterId = parseInt($stateParams.characterId);

    if ($scope.characterId == -1) {
        $scope.character = {
            Id: -1,
            Name: "Nuovo personaggio",
            Strength: 10,
            Size: 1,
            Race: "",
            Class: "",
            Image: "",
            Notes: "",
        };
    } else {
        angular.copy(Session.getCharacter($scope.characterId), $scope.character);
    }

    $scope.confirm = function () {
        Session.addOrModifyCharacter($scope.character).then(function () {
            $state.go("characters");
        })
    }
})