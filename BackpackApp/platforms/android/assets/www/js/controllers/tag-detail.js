angular.module("backpack.controllers.tagdetail", [])

.controller("TagDetailCtrl", function ($scope, $stateParams, $state, Session) {
    $scope.tag = {};
    $scope.isEdit = $stateParams.isEdit == "true";
    $scope.tagId = parseInt($stateParams.tagId);

    if ($scope.tagId == -1) {
        $scope.tag = {
            Id: $scope.tagId,
            Name: "Nuovo tag",
            Description: "",
            IsCustom: 1,
        };
    } else {
        angular.copy(Session.getTag($scope.tagId), $scope.tag);
    }

    $scope.confirm = function () {
        Session.addOrModifyTag($scope.tag).then(function () {
            $state.go("tabs.tags");
        })
    }
})