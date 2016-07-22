angular.module("backpack.controllers.tabitems", [])

.controller("TabItemsCtrl", function ($scope, $state, $filter, Loader, Session) {
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
    $scope.addItem = function (item) {
        var mainBag = $filter("filter")(Session.bags, { IsMain: true }, true)[0];
        var oldItem = $filter("filter")(mainBag.items, { Id: item.Id, IsModified: false }, true);
        if (oldItem.length > 0)
            oldItem[0].Quantity++;
        else {
            var bagItem = angular.merge({}, item);
            bagItem.Quantity = 1;
            bagItem.IsModified = false;
            mainBag.items.push(bagItem);
        }
    };
})