angular.module("backpack.controllers.tabinventory", [])

.controller("TabInventoryCtrl", function ($scope, $state, $ionicPopup, $ionicActionSheet, $ionicPopover, Loader, Session, Utility) {
    $scope.bags = Session.bags;
    $scope.isMultipleSelection = false;

    $scope.toggleBag = function (bag) {
        bag.isOpen = !bag.isOpen;
    };
    $scope.getItemWeight = function (bagItem) {
        return bagItem.item.Weight * bagItem.Quantity;
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
                load += $scope.getBagLoad(bag);
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
        angular.forEach(bag.items, function (bagItem) {
            load += (bagItem.Quantity * bagItem.item.Weight);
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
    $scope.removeBagItem = function (bag, bagItem, quantity) {
        if (quantity == undefined)
            quantity = 1;

        Session.removeBagItemPopup(bag, bagItem, quantity);
    }
    $scope.removeBagItemQuantity = function (bag, bagItem) {
        Utility.askQuantity($scope, "Quantità da buttare?", bagItem.Quantity, function (quantity) {
            $scope.removeBagItem(bag, bagItem, quantity);
        });
    }
    $scope.showDetails = function (item) {
        $state.go("tabs.inventory-item-detail", { itemId: item.Id })
    }
    $scope.showItemMenu = function (bag, bagItem) {
        var hideMenu = $ionicActionSheet.show({
            buttons: [
                { text: bagItem.Notes != "" ? "Modifica nota" : "Aggiungi nota" },
                { text: "Rimuovi quantità" },
            ],
            titleText: "Azioni",
            cancelText: "Annulla",
            buttonClicked: function (index) {
                switch (index) {
                    case 0:
                        $scope.modifyNote(bagItem);
                        break;
                    case 1:
                        $scope.removeBagItemQuantity(bag, bagItem);
                        break;
                }
                hideMenu();
            }
        })
    }
    $scope.modifyNote = function (bagItem) {
        $scope.notes = {
            value: bagItem.Notes,
        };
        $ionicPopup.show({
            template: "<input type='text' ng-model='notes.value'>",
            title: bagItem.Name + " - Note",
            scope: $scope,
            buttons: [
                { text: "Annulla" },
                {
                    text: "<b> Conferma </b>",
                    type: "button-positive",
                    onTap: function (e) {
                        if (!$scope.notes.value)
                            e.preventDefault();
                        else
                            return $scope.notes.value;
                    }
                }
            ]
        }).then(function (notes) {
            if (notes)
                Session.addBagItemNotes(bagItem, notes);
        })
    }
    $scope.showNotes = function ($event, item) {
        $event.stopPropagation();
        $scope.item = item;
        $ionicPopover.fromTemplateUrl("templates/popover/notes.html", {
            scope: $scope
        }).then(function (popover) {
            popover.show($event);
        })
    }
})