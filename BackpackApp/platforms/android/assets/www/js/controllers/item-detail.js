angular.module("backpack.controllers.itemdetail", [])

.controller("ItemDetailCtrl", function ($scope, $stateParams, $state, Session, Loader, Utility) {
    $scope.categories = Session.categories;
    $scope.item = {};
    $scope.isEdit = $stateParams.isEdit == "true";
    $scope.itemId = parseInt($stateParams.itemId);

    if ($scope.itemId == -1) {
        $scope.item.IsCustom = true;
        $scope.item[Utility.tables.categories.foreignKey] = 1;
        //TODO carica valori di default in $scope.item
    } else {
        angular.copy(Session.getItem($scope.itemId), $scope.item);
    }
    Loader.show();
    Session.getItemTags($scope.item.Id).then(function (tags) {
        $scope.item.tags = tags;
        Loader.hide();
    })
    if ($scope.item.Id > -1 && $scope.isEdit) {
        if (!$scope.item.IsCustom) {
            $scope.item.Id = -1;
            $scope.item.IsCustom = true;
        }
    }

    $scope.confirm = function () {
        Session.addOrModifyItem($scope.item).then(function () {
            $state.go("tabs.items");
        })
    }
})