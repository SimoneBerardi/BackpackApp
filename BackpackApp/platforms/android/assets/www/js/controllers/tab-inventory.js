angular.module("backpack.controllers.tabinventory", [])

.controller("TabInventoryCtrl", function ($scope, $state, $ionicPopup, Loader, Session) {
    $scope.bags = Session.bags;
    $scope.isMultipleSelection = false;

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
            angular.forEach($scope.bags, function (bag) {
                if (bag.Id != mainBag.Id && bag.IsMain)
                    bag.IsMain = false;
            })
    };
    $scope.getLoad = function () {
        var load = 0;
        angular.forEach($scope.bags, function (bag) {
            load += bag.Weight;
            if (!bag.HasFixedWeight)
                angular.forEach(bag.items, function (item) {
                    load += (item.Quantity * item.Weight);
                })
        });
        return load;
    };
    $scope.getLoadClass = function () {
        var className = "";
        if ($scope.getLoad() < Session.character.load.Light)
            className = "bar-balanced";
        else if ($scope.getLoad() < Session.character.load.Medium)
            className = "bar-energized";
        else if ($scope.getLoad() < Session.character.load.Heavy)
            className = "bar-assertive";
        return className;
    };
    $scope.activateMultipleSelection = function (item) {
        if (!$scope.isMultipleSelection) {
            $scope.clearSelection();
            $scope.isMultipleSelection = true;
            item.isSelected = true;
        }
    }
    $scope.clearSelection = function () {
        angular.forEach($scope.bags, function (bag) {
            angular.forEach(bag.items, function (item) {
                item.isSelected = false;
            })
        })
    }
    $scope.toggleItem = function (item) {
        item.isSelected = !item.isSelected;
    }
    $scope.getBagLoad = function (bag) {
        var load = 0;
        angular.forEach(bag.items, function (item) {
            load += (item.Quantity * item.Weight);
        });
        return load;
    }
    $scope.getBagLoadClass = function (bag) {
        var className = "";
        if ($scope.getBagLoad(bag) < bag.Capacity)
            className = "item-balanced";
        else
            className = "item-assertive";
        return className;
    }
    $scope.removeItem = function (bag, item, quantity) {
        if (quantity == undefined)
            quantity = 1;

        var popup = $ionicPopup.confirm({
            title: "Cancellazione",
            template: "Buttare " + quantity + " " + item.Name + "?"
        });

        popup.then(function (result) {
            if (result) {
                if (item.Quantity > quantity)
                    item.Quantity -= quantity;
                else {
                    var index = bag.items.indexOf(item);
                    bag.items.splice(index, 1);
                }
            }
        });
    }
    $scope.removeItemQuantity = function (bag, item) {
        $scope.quantity = {
            min: 1,
            max: item.Quantity,
        };
        var popup = $ionicPopup.show({
            //template: "<input type='number' value='1' ng-model='quantity.value' min='1' max ='" + item.Quantity + "' />",
            templateUrl: "templates/popup/quantity.html",
            controller: "QuantityPopupCtrl",
            title: "Quantità da buttare?",
            scope: $scope,
            buttons: [
                { text: "Annulla" },
                {
                    text: "<b>Conferma</b>",
                    type: "button-positive",
                    onTap: function (e) {
                        if (!$scope.quantity.value)
                            e.preventDefault();
                        else
                            return $scope.quantity.value;
                    }
                }
            ]
        });
        popup.then(function (quantity) {
            if (quantity)
                $scope.removeItem(bag, item, quantity);
        })
    }
})