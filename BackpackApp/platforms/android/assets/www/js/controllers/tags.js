angular.module("backpack.controllers.tags", [])

.controller("TagsCtrl", function ($scope, $state, Session, Utility) {
    $scope.tags = Session.tags;

    $scope.delete = function (tag) {
        Utility.confirmDeleteTag(tag, function () {
            Session.deleteTag(tag);
        })
    }
})