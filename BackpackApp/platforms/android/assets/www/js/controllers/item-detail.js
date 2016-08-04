﻿angular.module("backpack.controllers.itemdetail", [])

.controller("ItemDetailCtrl", function ($scope, $stateParams, $state, Session, Loader, Utility) {
    $scope.categories = Session.categories;
    $scope.item = {};
    $scope.isEdit = $stateParams.isEdit == "true";
    $scope.itemId = parseInt($stateParams.itemId);

    if ($scope.itemId == -1) {
        $scope.item = {
            Id: $scope.itemId,
            Name: "Nuovo oggetto",
            Description: "",
            Weight: 0.0,
            Image: "",
            IsCustom: 1,
            IsUnidentified: 0,
        };
        $scope.item[Utility.tables.Categories.foreignKey] = Session.categories[0].Id;
    } else {
        angular.copy(Session.getItem($scope.itemId), $scope.item);
    }
    Loader.show();
    Session.getItemTags($scope.item.Id).then(function (tags) {
        $scope.item.tags = tags;
        Loader.hide();
    })
    if ($scope.item.Id > -1 && $scope.isEdit) {
        if ($scope.item.IsCustom == 0) {
            $scope.item.Id = -1;
            $scope.item.IsCustom = 1;
        }
    }

    $scope.confirm = function () {
        Session.addOrModifyItem($scope.item).then(function () {
            $state.go("tabs.items");
        })
    }
})