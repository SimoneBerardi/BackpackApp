angular.module("backpack.controllers.tabinventory", [])

.controller("TabInventoryCtrl", function ($scope, $state, $ionicPopup, $ionicActionSheet, $ionicPopover, $filter, Loader, Session, Utility) {
    $scope.bags = Session.bags;
    $scope.isMultipleSelection = false;
    $scope.isSearching = false;

    $scope.toggleBag = function (bag) {
        bag.isOpen = !bag.isOpen;
    };
    $scope.getItemWeight = function (bagItem) {
        return bagItem.item.Weight * bagItem.Quantity;
    };
    $scope.selectMainBag = function ($event, mainBag) {
        $event.stopPropagation();
        if (mainBag.IsMain == 0) {
            $event.preventDefault();
            mainBag.IsMain = true;
        } else
            Session.addOrModifyBag(mainBag).then(function () {
                angular.forEach($scope.bags, function (bag) {
                    if (bag.Id != mainBag.Id && bag.IsMain == 1) {
                        bag.IsMain = 0;
                        Session.addOrModifyBag(bag);
                    }
                })
            })
    };
    $scope.getLoad = function () {
        var load = 0;
        angular.forEach($scope.bags, function (bag) {
            load += bag.Weight;
            if (bag.HasFixedWeight == 0)
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
        else
            className = "bar-dark";
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
    $scope.removeBagItem = function (bagItem, quantity) {
        if (quantity == undefined)
            quantity = 1;

        Utility.confirmRemoveBagItemQuantity(bagItem.item, quantity, function () {
            Session.removeBagItem(bagItem, quantity);
        })
    }
    $scope.removeBagItemQuantity = function (bagItem) {
        Utility.askQuantity($scope, "Quantità da buttare?", bagItem.Quantity, function (quantity) {
            $scope.removeBagItem(bagItem, quantity);
        });
    }
    $scope.showItemMenu = function (bag, bagItem) {
        var buttons = [
            { text: "Aggiungi quantità" },
            { text: "Dettagli" },
            { text: "Modifica nota" },
            { text: "Rimuovi quantità" },
        ];
        if ($scope.bags.length > 1) {
            buttons.push({ text: "Sposta" });
            buttons.push({ text: "Sposta quantità" });
        }
        var hideMenu = $ionicActionSheet.show({
            buttons: buttons,
            titleText: "Azioni",
            cancelText: "Annulla",
            buttonClicked: function (index) {
                switch (index) {
                    case 0:
                        $scope.addBagItemQuantity(bagItem.item);
                        break;
                    case 1:
                        $state.go("tabs.inventory-item-detail", { itemId: bagItem.item.Id })
                        break;
                    case 2:
                        $scope.modifyNote(bagItem);
                        break;
                    case 3:
                        $scope.removeBagItemQuantity(bagItem);
                        break;
                    case 4:
                        $scope.moveBagItemBag(bag, bagItem);
                        break;
                    case 5:
                        $scope.moveBagItemBagQuantity(bag, bagItem);
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
            title: bagItem.item.Name + " - Note",
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
    $scope.moveBagItem = function (sourceBag, destBag, bagItem, quantity) {
        if (quantity == undefined)
            quantity = 1;

        Session.moveBagItem(sourceBag, destBag, bagItem, quantity);
    }
    $scope.toggleEquipped = function (bag, bagItem) {
        if ($scope.bags.length > 1) {
            var destBag;
            if (bag.IsEquipped == 1)
                if (bag.IsMain == 1)
                    destBag = $scope.bags[1];
                else
                    destBag = $filter("filter")($scope.bags, { IsMain: 1 }, true)[0];
            else
                destBag = $filter("filter")($scope.bags, { IsEquipped: 1 }, true)[0];
            $scope.moveBagItem(bag, destBag, bagItem);
        } else {
            $ionicPopup.alert({
                title: "Attenzione!",
                template: "Non sono presenti borse!"
            })
        }
    }
    $scope.moveBagItemBag = function (bag, bagItem, quantity) {
        if (quantity == undefined)
            quantity = 1;
        var list = [];
        angular.forEach($scope.bags, function (listBag) {
            if (bag.Id != listBag.Id && listBag.IsEquipped == 0)
                list.push(angular.copy(listBag));
        })
        Utility.selectFromList($scope, "Seleziona la borsa", list, function (select) {
            var destBag = $filter("filter")($scope.bags, { Id: select.Id }, true)[0];
            $scope.moveBagItem(bag, destBag, bagItem, quantity);
        })
    }
    $scope.moveBagItemBagQuantity = function (bag, bagItem) {
        Utility.askQuantity($scope, "Quantità da spostare?", bagItem.Quantity, function (quantity) {
            $scope.moveBagItemBag(bag, bagItem, quantity);
        });
    }
    $scope.showBagMenu = function (bag) {
        var hideMenu = $ionicActionSheet.show({
            buttons: [
                { text: "Nuovo" },
                { text: "Modifica" },
            ],
            titleText: "Azioni",
            cancelText: "Annulla",
            destructiveText: bag.IsEquipped == 0 ? "" : "Elimina",
            destructiveButtonClicked: function () {
                hideMenu();
                Utility.confirmDeleteBag(bag, function () {
                    Session.deleteBag(bag);
                });
            },
            buttonClicked: function (index) {
                switch (index) {
                    case 0:
                        $state.go("tabs.bag-detail", { bagId: -1 })
                        break;
                    case 1:
                        $state.go("tabs.bag-detail", { bagId: bag.Id })
                        break;
                }
                hideMenu();
            }
        })
    }
    $scope.toggleSearching = function () {
        if ($scope.isSearching)
            $scope.query = "";
        $scope.isSearching = !$scope.isSearching;
    }
    $scope.addBagItem = function (item, quantity) {
        if (quantity == undefined)
            quantity = 1;
        var mainBag = $filter("filter")(Session.bags, { IsMain: 1 }, true)[0];
        Session.addBagItem(mainBag, item, quantity);
    }
    $scope.addBagItemQuantity = function (item) {
        Utility.askQuantity($scope, "Quantità da aggiungere?", null, function (quantity) {
            $scope.addBagItem(item, quantity);
        });
    }
})