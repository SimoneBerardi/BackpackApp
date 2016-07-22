angular.module("backpack.services.utility", [])

.factory("Utility", function ($q) {
    var self = this;

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
        },
        bagItems: {
            name: "Bag_Items",
        }
    }

    self.iterateProperties = function (obj, callback) {
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                callback(property);
            }
        }
    }

    return self;
})