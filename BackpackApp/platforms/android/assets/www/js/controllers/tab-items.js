angular.module("backpack.controllers.tabitems", [])

.controller("TabItemsCtrl", function ($scope, $state, $filter, $ionicPopup, $ionicActionSheet, Loader, Session, Utility) {
    $scope.search = "";
    $scope.categories = Session.categories;

    $scope.toggleCategory = function (category) {
        category.isOpen = !category.isOpen;
    };
    $scope.getInventoryQuantity = function (item) {
        var quantity = 0;
        angular.forEach(Session.bags, function (bag) {
            var bagItems = Session.getBagItem(bag, item);
            if (bagItems.length > 0)
                angular.forEach(bagItems, function (bagItem) {
                    quantity += bagItem.Quantity;
                });
        });
        return quantity;
    };
    $scope.addBagItem = function (item, quantity) {
        if (quantity == undefined)
            quantity = 1;
        var mainBag = $filter("filter")(Session.bags, { IsMain: 1 }, true)[0];
        Session.addBagItem(mainBag, item, quantity);
    };
    $scope.addBagItemQuantity = function (item) {
        var title = "Quantità da aggiungere?";
        Utility.askQuantity($scope, title, null, function (quantity) {
            $scope.addBagItem(item, quantity);
        });
    }
    $scope.showDetails = function ($event, item, isEdit) {
        if ($event)
            $event.stopPropagation();
        $state.go("tabs.items-item-detail", { itemId: item.Id, isEdit: isEdit });
    }
    $scope.showMenu = function (item) {
        var buttons = [];
        buttons.push({ text: "Aggiungi" });
        if ($scope.getInventoryQuantity(item) > 0)
            buttons.push({ text: "Rimuovi" });
        buttons.push({ text: item.IsCustom == 1 ? "Modifica" : "Nuovo" });
        buttons.push({ text: "Gestione proprietà" });

        var hideMenu = $ionicActionSheet.show({
            buttons: buttons,
            titleText: "Azioni",
            cancelText: "Annulla",
            destructiveText: item.IsCustom == 1 ? "Elimina" : "",
            destructiveButtonClicked: function () {
                hideMenu();
                Utility.confirmDeleteItem(item, function () {
                    Session.deleteItem(item);
                });
            },
            buttonClicked: function (index, button) {
                switch (button.text) {
                    case "Aggiungi":
                        $scope.addBagItemQuantity(item);
                        break;
                    case "Rimuovi":
                        $scope.removeBagItemQuantity(item);
                        break;
                    case "Modifica":
                    case "Nuovo":
                        $scope.showDetails(null, item, true);
                        break;
                    case "Gestione proprietà":
                        $state.go("tabs.tags");
                        break;
                }
                hideMenu();
            }
        })
    }
    $scope.removeBagItem = function (item, quantity) {
        if (quantity == undefined)
            quantity = 1;

        if ($scope.getInventoryQuantity(item) >= quantity) {
            Utility.confirmRemoveBagItemQuantity({ item: item, Notes: "" }, quantity, function () {
                var mainBag = $filter("filter")(Session.bags, { IsMain: 1 }, true)[0];
                bagItem = Session.getBagItem(mainBag, item);
                if (bagItem.length > 0) {
                    bagItem = bagItem[0];
                    var quantityToRemove = Math.min(quantity, bagItem.Quantity);
                    Session.removeBagItem(bagItem, quantityToRemove);
                    quantity -= quantityToRemove;
                }
                var index = 0;
                var bags = $filter("filter")(Session.bags, { IsMain: 0 }, true);
                while (quantity > 0) {
                    bagItem = Session.getBagItem(bags[index], item);
                    if (bagItem.length > 0) {
                        bagItem = bagItem[0];
                        var quantityToRemove = Math.min(quantity, bagItem.Quantity);
                        Session.removeBagItem(bagItem, quantityToRemove)
                        quantity -= quantityToRemove;
                    }
                    index++;
                }
            })
        }
    }
    $scope.removeBagItemQuantity = function (item) {
        if ($scope.getInventoryQuantity(item) > 0) {
            var title = "Quantità da buttare?";
            Utility.askQuantity($scope, title, $scope.getInventoryQuantity(item), function (quantity) {
                $scope.removeBagItem(item, quantity);
            })
        }
    }
})