angular.module("backpack.controllers.tabinventory", [])

.controller("TabInventoryCtrl", function ($scope, $state, Loader, Session) {
    $scope.bags = Session.bags;

    $scope.toggleBag = function (bag) {
        bag.isOpen = !bag.isOpen;
    };
    $scope.getItemWeight = function (item) {
        return item.Weight * item.Quantity;
    };
    $scope.selectMainBag = function ($event, mainBag) {
        $event.stopPropagation();
        if (!mainBag.IsMain) {
            $event.preventDefault();
            mainBag.IsMain = true;
        } else
            angular.forEach(this.bags, function (bag) {
                if (bag.Id != mainBag.Id && bag.IsMain)
                    bag.IsMain = false;
            })
    };
    $scope.getLoad = function () {
        return 50;
    };
    $scope.getLoadClass = function () {
        var className = "";
        if (this.getLoad() < Session.character.load.Light)
            className = "bar-balanced";
        else if (this.getLoad() < Session.character.load.Medium)
            className = "bar-energized";
        else if (this.getLoad() < Session.character.load.Heavy)
            className = "bar-assertive";
        return className;
    };
})