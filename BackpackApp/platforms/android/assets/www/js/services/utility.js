angular.module("backpack.services.utility", [])

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
    //Indica la versione di dnd da gestire
    //a scelta tra 5 e 3.5 in formato stringa
    self.version = "5",

    self.iterateProperties = function (obj, callback) {
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                callback(property);
            }
        }
    }
    self.askText = function ($scope, title, value, onConfirm) {
        $scope.text = {
            value: value,
        };
        $ionicPopup.show({
            template: "<input type='text' ng-model='text.value'>",
            title: title,
            scope: $scope,
            buttons: [
                { text: "Annulla" },
                {
                    text: "<b> Conferma </b>",
                    type: "button-positive",
                    onTap: function (e) {
                        if (!$scope.text.value)
                            e.preventDefault();
                        else
                            return $scope.text.value;
                    }
                }
            ]
        }).then(function (text) {
            if (text)
                onConfirm(text);
        })
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
    self.confirmDeleteTag = function (tag, onConfirm) {
        var title = "Eliminazione";
        var message = "Eliminare il tag e tutti i suoi riferimenti?";
        self._confirm(title, message, onConfirm);
    }
    self.confirmDeleteCharacter = function (character, onConfirm) {
        var title = "Eliminazione";
        var message = "Eliminare il personaggio " + character.Name + "?";
        self._confirm(title, message, onConfirm);
    }
    self.confirmDeleteBag = function (bag, onConfirm) {
        var title = "Eliminazione";
        var message = "Eliminare la borsa " + bag.Name + " e tutto il suo contenuto?";
        self._confirm(title, message, onConfirm);
    }
    self.confirmRemoveBagItemQuantity = function (bagItem, quantity, onConfirm) {
        var title = "Cancellazione";
        var message = "Buttare " + quantity + " " + bagItem.item.Name;
        if (bagItem.Notes != "")
            message += " [" + bagItem.Notes + "]";
        message += " ?";
        self._confirm(title, message, onConfirm);
    }
    self.confirmDeleteItem = function (item, onConfirm) {
        var title = "Eliminazione";
        var message = "Eliminare " + item.Name + " dall'inventario di tutti i personaggi?";
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