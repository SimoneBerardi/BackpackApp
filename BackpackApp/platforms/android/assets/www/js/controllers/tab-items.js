angular.module("backpack.controllers.tabitems", [])

.controller("TabItemsCtrl", function ($scope, $state, $filter, $ionicPopup, Loader, Session) {
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
        var oldItem = $filter("filter")(mainBag.items, { Id: item.Id, IsModified: false }, true);
        if (oldItem.length > 0)
            oldItem[0].Quantity += quantity;
        else {
            var bagItem = angular.merge({}, item);
            bagItem.Quantity = quantity;
            bagItem.IsModified = false;
            mainBag.items.push(bagItem);
        }
    };
    $scope.addItemQuantity = function (item) {
        $scope.quantity = {
            min: 1,
        };
        var popup = $ionicPopup.show({
            //template: "<input type='number' ng-model='quantity.value' min='1' />",
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
})