angular.module("backpack.services.utility", [])

.factory("Utility", function ($ionicPopup) {
    var self = this;

    self.isDebugging = false;
    self.sizes = {
        0: "Piccola",
        1: "Media",
        2: "Grande"
    };
    self.tables = {
        characters: {
            name: "Characters",
            foreignKey: "Character_Id",
        },
        bags: {
            name: "Character_Bags",
            foreignKey: "Bag_Id",
        },
        items: {
            name: "Items",
            foreignKey: "Item_Id",
            columns: [
                "Id",
                "Name",
                "Description",
                "Weight",
                "Notes",
                "Image",
                "IsCustom",
                "IsUnidentified",
                "Category_Id"
            ]
        },
        bagItems: {
            name: "Bag_Items",
        },
        categories: {
            name: "Categories",
            foreignKey: "Category_Id",
        },
        loads: {
            name: "Loads",
        },
        tags: {
            name: "Tags",
            foreignKey: "Tag_Id",
        },
        itemTags: {
            name: "Item_Tags",
            columns: [
                "Id",
                "Item_Id",
                "Tag_Id"
            ]
        }
    }

    self.iterateProperties = function (obj, callback) {
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                callback(property);
            }
        }
    }
    self.askQuantity = function ($scope, title, max, onConfirm) {
        $scope.quantity = {
            min: 1,
            max: max,
        }
        $ionicPopup.show({
            templateUrl: "templates/popup/quantity.html",
            controller: "QuantityPopupCtrl",
            title: title,
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
        }).then(function (quantity) {
            if (quantity)
                onConfirm(quantity);
        })
    }
    self.confirmDeleteItemQuantity = function (quantity, name, onConfirm) {
        self._confirm("Cancellazione", "Buttare " + quantity + " " + name + "?", onConfirm);
    }
    self.confirmDeleteItem = function (name, onConfirm) {
        self._confirm("Cancellazione", "Eliminare " + name + " dall'inventario di tutti i personaggi?", onConfirm);
    }
    self._confirm = function (title, message, onConfirm) {
        $ionicPopup.confirm({
            title: title,
            template: message
        }).then(function (result) {
            if (result) {
                onConfirm();
            }
        });
    }

    return self;
})