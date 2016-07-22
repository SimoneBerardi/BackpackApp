angular.module("backpack.controllers.tabinventory", [])

.controller("TabInventoryCtrl", function ($scope, $state, Loader, Session) {
    $scope.bags = Session.bags;

    $scope.toggleBag = function (bag) {
        bag.isOpen = !bag.isOpen;
    };
})