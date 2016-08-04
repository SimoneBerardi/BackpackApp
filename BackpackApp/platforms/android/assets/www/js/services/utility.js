﻿angular.module("backpack.services.utility", [])

.factory("Utility", function ($ionicPopup) {
    var self = this;

    self.isDebugging = false;
    self.sizes = [
         {
             id: 0,
             name: "Piccola",
         },
         {
             id: 1,
             name: "Media",
         },
         {
             id: 2,
             name: "Grande",
         },
    ];
    self.tables = {};

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
        };
        if (max)
            $scope.quantity.max = max;
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
    self.confirmDeleteBag = function (name, onConfirm) {
        var title = "Eliminazione";
        var message = "Eliminare la borsa " + name + " e tutto il suo contenuto?";
        self._confirm(title, message, onConfirm);
    }
    self.confirmRemoveItemQuantity = function (quantity, name, onConfirm) {
        var title = "Cancellazione";
        var message = "Buttare " + quantity + " " + name + "?";
        self._confirm(title, message, onConfirm);
    }
    self.confirmDeleteItem = function (name, onConfirm) {
        var title = "Eliminazione";
        var message = "Eliminare " + name + " dall'inventario di tutti i personaggi?";
        self._confirm(title, message, onConfirm);
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
    self.selectFromList = function ($scope, title, list, onConfirm) {
        $scope.list = {
            elements: list,
            value: list[0],
        };
        $ionicPopup.show({
            templateUrl: "templates/popup/select.html",
            title: title,
            scope: $scope,
            buttons: [
                { text: "Annulla" },
                {
                    text: "<b>Conferma</b>",
                    type: "button-positive",
                    onTap: function (e) {
                        if (!$scope.list.value)
                            e.preventDefault();
                        else
                            return $scope.list.value;
                    }
                }
            ]
        }).then(function (select) {
            if (select)
                onConfirm(select);
        })
    }

    return self;
})