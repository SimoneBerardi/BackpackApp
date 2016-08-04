angular.module("backpack.controllers.bagdetail", [])

.controller("BagDetailCtrl", function ($scope, $stateParams, $state, Session) {
    $scope.bag = {};
    $scope.bagId = parseInt($stateParams.bagId);

    if ($scope.bagId == -1) {
        $scope.bag = {
            Id: $scope.bagId,
            Name: "Nuova borsa",
            Capacity: 0.0,
            Weight: 0.0,
            HasFixedWeight: 0,
            IsEquipped: 0,
            IsMain: 0,
            Image: "",
        };
    } else {
        angular.copy(Session.getBag($scope.bagId), $scope.bag);
    }

    $scope.confirm = function () {
        Session.addOrModifyBag($scope.bag).then(function () {
            $state.go("tabs.inventory");
        })
    }
})