angular.module("backpack.controllers.popup", [])

.controller("QuantityPopupCtrl", function ($scope, $interval) {
    $scope.timer = null;

    if ($scope.quantity.min != undefined)
        $scope.quantity.value = $scope.quantity.min;
    else
        $scope.quantity.value = 0;

    $scope.add = function () {
        if ($scope.quantity.max == undefined || $scope.quantity.value < $scope.quantity.max)
            $scope.quantity.value++;
    }
    $scope.remove = function () {
        if ($scope.quantity.min == undefined || $scope.quantity.value > $scope.quantity.min)
            $scope.quantity.value--;
    }
    $scope.startTimer = function (callback) {
        $scope.timer = $interval(function () {
            callback();
        }, 100);
    }
    $scope.stopTimer = function () {
        $interval.cancel($scope.timer);
    }
})