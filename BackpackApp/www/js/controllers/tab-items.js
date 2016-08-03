angular.module("backpack.controllers.tabitems", [])

.controller("TabItemsCtrl", function ($scope, $state, $filter, $ionicPopup, $ionicActionSheet, Loader, Session, Utility) {
    $scope.categories = Session.categories;

    $scope.toggleCategory = function (category) {
        category.isOpen = !category.isOpen;
    };
    $scope.getInventoryQuantity = function (item) {
        var quantity = 0;
        angular.forEach(Session.bags, function (bag) {
            var bagItems = $filter("filter")(bag.items, { Id: item.Id }, true);
            if (bagItems.length > 0)
                angular.forEach(bagItems, function (bagItem) {
                    quantity += bagItem.Quantity;
                });
        });
        return quantity;
    };
    $scope.addItem = function (item, quantity) {
        if (quantity == undefined)
            quantity = 1;
        var mainBag = $filter("filter")(Session.bags, { IsMain: true }, true)[0];
        var oldItem = $filter("filter")(mainBag.items, { Id: item.Id }, true);
        if (oldItem.length > 0)
            oldItem[0].Quantity += quantity;
        else {
            var bagItem = angular.merge({}, item);
            bagItem.Quantity = quantity;
            mainBag.items.push(bagItem);
        }
    };
    $scope.addItemQuantity = function (item) {
        $scope.quantity = {
            min: 1,
        };
        var popup = $ionicPopup.show({
            templateUrl: "templates/popup/quantity.html",
            controller: "QuantityPopupCtrl",
            title: "Quantità da aggiungere?",
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
                $scope.addItem(item, quantity);
        })
    }
    $scope.showDetails = function ($event, item, isEdit) {
        if ($event)
            $event.stopPropagation();
        $state.go("tabs.items-item-detail", { itemId: item.Id, isEdit: isEdit })
    }
    $scope.showMenu = function (item) {
        var hideMenu = $ionicActionSheet.show({
            buttons: [
                { text: "Aggiungi quantità" },
                { text: item.IsCustom ? "Modifica" : "Nuovo" }
            ],
            titleText: "Azioni",
            cancelText: "Annulla",
            destructiveText: item.IsCustom ? "Elimina" : "",
            destructiveButtonClicked: function () {
                hideMenu();
                Utility.confirmDeleteItem(item.Name, function () {
                    Session.removeItem(item);
                });
            },
            buttonClicked: function (index) {
                switch (index) {
                    case 0:
                        $scope.addItemQuantity(item);
                        break;
                    case 1:
                        $scope.showDetails(null, item, true);
                        break;
                }
                hideMenu();
            }
        })
    }
    $scope.removeItem = function (item, quantity) {
        if (quantity == undefined)
            quantity = 1;

        if ($scope.getInventoryQuantity(item) >= quantity) {
            Utility.confirmDeleteItemQuantity(quantity, item.Name, function () {
                var mainBag = $filter("filter")(Session.bags, { IsMain: true }, true)[0];
                var mainBagItem = $filter("filter")(mainBag.items, { Id: item.Id }, true);
                if (mainBagItem.length > 0) {
                    mainBagItem = mainBagItem[0];
                    var itemQuantity = mainBagItem.Quantity;
                    Session.removeBagItem(mainBag, item, Math.min(quantity, mainBagItem.Quantity));
                    quantity -= itemQuantity;
                }
                var index = 0;
                var bags = $filter("filter")(Session.bags, { IsMain: false }, true);
                while (quantity > 0) {
                    var bagItem = $filter("filter")(bags[index].items, { Id: item.Id }, true);
                    if (bagItem.length > 0) {
                        bagItem = bagItem[0];
                        var itemQuantity = bagItem.Quantity;
                        Session.removeBagItem(bags[index], item, Math.min(quantity, bagItem.Quantity))
                        quantity -= itemQuantity;
                    }
                    index++;
                }
            })
        }
    }
    $scope.removeItemQuantity = function (item) {
        if ($scope.getInventoryQuantity(item) > 0) {
            Utility.askQuantity($scope, "Quantità da buttare?", $scope.getInventoryQuantity(item), function (quantity) {
                $scope.removeItem(item, quantity);
            })
        }
    }
})