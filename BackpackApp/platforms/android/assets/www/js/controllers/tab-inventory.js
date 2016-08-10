angular.module("backpack.controllers.tabinventory", [])

.controller("TabInventoryCtrl", function ($scope, $state, $ionicPopup, $ionicActionSheet, $ionicPopover, $filter, Loader, Session, Utility) {
    $scope.bags = Session.bags;
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
    $scope.getBagWeight = function (bag) {
        var load = bag.Weight;
        if (!bag.HasFixedWeight)
            load += $scope.getBagLoad(bag);
        return load;
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

        Utility.confirmRemoveBagItemQuantity(bagItem, quantity, function () {
            Session.removeBagItem(bagItem, quantity);
        })
    }
    $scope.removeBagItemQuantity = function (bagItem) {
        var title = "Quantità da buttare?";
        Utility.askQuantity($scope, title, bagItem.Quantity, function (quantity) {
            $scope.removeBagItem(bagItem, quantity);
        });
    }
    $scope.showItemMenu = function (bag, bagItem) {
        var buttons = [];
        buttons.push({ text: "Aggiungi" });
        buttons.push({ text: "Rimuovi" });
        if ($scope.bags.length > 1) {
            buttons.push({ text: "Sposta" });
        }
        if (bagItem.Quantity > 1) {
            buttons.push({ text: "Dividi" });
        }
        buttons.push({ text: "Note" });
        buttons.push({ text: "Dettagli oggetto" });
        $ionicActionSheet.show({
            buttons: buttons,
            titleText: "Azioni",
            cancelText: "Annulla",
            destructiveText: "Butta",
            destructiveButtonClicked: function () {
                Utility.confirmRemoveBagItemQuantity(bagItem, bagItem.Quantity, function () {
                    Session.removeBagItem(bagItem, bagItem.Quantity);
                })
                return true;
            },
            buttonClicked: function (index, button) {
                switch (button.text) {
                    case "Aggiungi":
                        $scope.addBagItemQuantity(bagItem);
                        break;
                    case "Rimuovi":
                        $scope.removeBagItemQuantity(bagItem);
                        break;
                    case "Sposta":
                        $scope.moveBagItemBagQuantity(bag, bagItem);
                        break;
                    case "Dividi":
                        $scope.splitBagItem(bag, bagItem);
                        break;
                    case "Note":
                        $scope.modifyNote(bagItem);
                        break;
                    case "Dettagli oggetto":
                        $state.go("tabs.inventory-item-detail", { itemId: bagItem.item.Id })
                        break;
                }
                return true;
            }
        })
    }
    $scope.splitBagItem = function (bag, bagItem) {
        var title = "Quantità da dividere?"
        Utility.askQuantity($scope, title, bagItem.Quantity - 1, function (quantity) {
            title = "Nota da aggiungere?"
            var value = "Gruppo da " + quantity;
            Utility.askText($scope, title, value, function (text) {
                Session.removeBagItem(bagItem, quantity).then(function () {
                    Session.addBagItem(bag, bagItem.item, quantity, text);
                })
            })
        })
    }
    $scope.modifyNote = function (bagItem) {
        var title = bagItem.item.Name + " - Note";
        Utility.askText($scope, title, bagItem.Notes, function (text) {
            Session.modifyBagItemNotes(bagItem, text);
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
        var title = "Quantità da spostare?";
        Utility.askQuantity($scope, title, bagItem.Quantity, function (quantity) {
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
            destructiveText: bag.IsEquipped == 1 ? "" : "Elimina",
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
    $scope.addBagItem = function (bagItem, quantity) {
        if (quantity == undefined)
            quantity = 1;
        var mainBag = $filter("filter")(Session.bags, { IsMain: 1 }, true)[0];
        Session.addBagItemQuantity(bagItem, quantity);
    }
    $scope.addBagItemQuantity = function (bagItem) {
        var title = "Quantità da aggiungere?";
        Utility.askQuantity($scope, title, null, function (quantity) {
            $scope.addBagItem(bagItem, quantity);
        });
    }
})