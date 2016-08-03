angular.module("backpack.services.session", [])

.factory("Session", function ($q, $state, $filter, $ionicPopup, Database, Utility) {
    var self = this;

    self.isInitialized = false;

    self.loads = [];
    self.characters = [];
    self.items = [];
    self.categories = [];
    self.tags = [];

    self.character = null;
    self.bags = [];

    self.init = function () {
        var deferred = $q.defer();
        Database.init().then(function () {
            return Database.selectAll(Utility.tables.Loads);
        }).then(function (loads) {
            self.loads = loads;
            return Database.selectAll(Utility.tables.Characters);
        }).then(function (characters) {
            //Carico i personaggi
            angular.forEach(characters, function (character) {
                character.sizeName = Utility.sizes[character.Size];
            });
            self.characters = characters;
            //Carico gli oggetti
            return Database.selectAll(Utility.tables.Items);
        }).then(function (items) {
            angular.forEach(items, function (item) {
                item.IsCustom = item.IsCustom == 1;
                item.IsUnidentified = item.IsUnidentified == 1;
            })
            self.items = items;
            //Carico le categorie degli oggetti
            return Database.selectAll(Utility.tables.Categories);
        }).then(function (categories) {
            self.categories = categories;
            self._loadCategories(self.categories);
            //Carico i tags
            return Database.selectAll(Utility.tables.Tags);
        }).then(function (tags) {
            self.tags = tags;

            //Inizializzazione completata
            self.isInitialized = true;
            deferred.resolve();
        });
        return deferred.promise;
    };
    self.getBagItem = function (bag, item) {
        return $filter("filter")(bag.items, function (bagItem, index, array) {
            return bagItem[Utility.tables.Items.foreignKey] == item.Id;
        }, true);
    };
    self.removeBagItemPopup = function (bag, bagItem, quantity) {
        Utility.confirmDeleteItemQuantity(quantity, bagItem.item.Name, function () {
            self.removeBagItem(bag, bagItem, quantity);
        })
    };
    self.getItemTags = function (id) {
        var deferred = $q.defer();
        Database.selectByColumn(Utility.tables.Item_Tags, Utility.tables.Items.foreignKey, id).then(function (itemTags) {
            var tags = [];
            angular.forEach(self.tags, function (tag) {
                var hasTag = $filter("filter")(itemTags, function (itemTag, index, array) {
                    return itemTag[Utility.tables.Tags.foreignKey] == tag.Id;
                }, true).length > 0;
                tags.push({
                    Id: tag.Id,
                    name: tag.Name,
                    value: hasTag,
                    initialValue: hasTag,
                });
            });
            deferred.resolve(tags);
        });
        return deferred.promise;
    };
    self.getItem = function (id) {
        return $filter("filter")(self.items, { Id: id }, true)[0];
    };
    self.selectCharacter = function (character) {
        var deferred = $q.defer();

        var load = $filter("filter")(self.loads, { Strength: character.Strength }, true)[0];
        character.load = load;

        self.character = character;
        //Carico le borse
        Database.selectByColumn(Utility.tables.Character_Bags, Utility.tables.Characters.foreignKey, character.Id).then(function (bags) {
            var promises = [];
            angular.forEach(bags, function (bag) {
                promises.push(self._loadBag(bag));
            });
            $q.all(promises).then(function () {
                self.bags = bags;
                deferred.resolve();
            });
        });

        return deferred.promise;
    };
    //---Metodi database---
    self.addBagItemNotes = function (bagItem, notes) {
        bagItem.Notes = notes;
        return Database.insertOrReplace(Utility.tables.Bag_Items, bagItem);
    };
    self.addBagItem = function (bag, item, quantity) {
        var deferred = $q.defer();
        var bagItem = self.getBagItem(bag, item);
        if (bagItem.length > 0) {
            bagItem = bagItem[0];
            bagItem.Quantity += quantity;
        }
        else {
            bagItem = {
                Id: -1,
                Quantity: quantity,
                Notes: "",
            };
            bagItem[Utility.tables.Character_Bags.foreignKey] = bag.Id;
            bagItem[Utility.tables.Items.foreignKey] = item.Id;
        }
        Database.insertOrReplace(Utility.tables.Bag_Items, bagItem).then(function (result) {
            bagItem.Id = result.insertId;
            var index = bag.items.indexOf(bagItem);
            if (index < 0) {
                bagItem.item = item;
                bag.items.push(bagItem);
            }
            deferred.resolve();
        });
        return deferred.promise;
    }
    self.removeBagItem = function (bag, bagItem, quantity) {
        var deferred = $q.defer();
        if (bagItem.Quantity > quantity) {
            bagItem.Quantity -= quantity;
            Database.insertOrReplace(Utility.tables.Bag_Items, bagItem).then(function (result) {
                deferred.resolve();
            });
        }
        else {
            Database.removeById(Utility.tables.Bag_Items, bagItem.Id).then(function (result) {
                var index = bag.items.indexOf(bagItem);
                bag.items.splice(index, 1);
            })
        }
        return deferred.promise;
    };
    self.removeItem = function (item) {
        var deferred = $q.defer();
        Database.removeById(Utility.tables.Items, item.Id).then(function () {
            Database.removeByColumn(Utility.tables.Item_Tags, Utility.tables.Items.foreignKey, item.Id).then(function () {
                var index = self.items.indexOf(item);
                self.items.splice(index, 1);
                angular.forEach(self.bags, function (bag) {
                    var bagItems = $filter("filter")(bag.items, { Id: item.Id }, true);
                    angular.forEach(bagItems, function (bagItem) {
                        index = bag.items.indexOf(bagItem);
                        if (index >= 0)
                            bag.items.splice(index, 1);
                    })
                });
                deferred.resolve();
            });
        });
        return deferred.promise;
    }
    self.addOrModifyItem = function (item) {
        var deferred = $q.defer();
        var promises = [];
        Database.insertOrReplace(Utility.tables.Items, item).then(function (result) {
            item.Id = result.insertId;
            var oldItem = $filter("filter")(self.items, { Id: item.Id }, true);
            if (oldItem.length > 0)
                angular.merge(oldItem, item);
            else
                self.items.push(item);

            //Salvo i tag su db
            angular.forEach(item.tags, function (tag) {
                if (tag.value != tag.initialValue) {
                    if (tag.initialValue) {
                        promises.push(Database.removeById(Utility.tables.Item_Tags, tag.Id));
                    } else {
                        var itemTag = {};
                        itemTag.Id = -1;
                        itemTag[Utility.tables.Items.foreignKey] = item.Id;
                        itemTag[Utility.tables.Tags.foreignKey] = tag.Id;
                        promises.push(Database.insertOrReplace(Utility.tables.Item_Tags, itemTag));
                    }
                }
            })

            $q.all(promises).then(function () {
                deferred.resolve();
            });
        });
        return deferred.promise;
    };
    //---Metodi privati---
    self._loadCategories = function (categories) {
        angular.forEach(categories, function (category) {

            category.isOpen = true;

            category.getItems = function () {
                return $filter("filter")(self.items, function (item, index, array) {
                    return item[Utility.tables.Categories.foreignKey] == category.Id;
                }, true);
            };
        })
    };
    self._loadBag = function (bag) {
        var deferred = $q.defer();

        bag.items = [];
        bag.isOpen = true;
        bag.HasFixedWeight = bag.HasFixedWeight == 1;
        bag.IsEquipped = bag.IsEquipped == 1;
        bag.IsMain = bag.IsMain == 1;

        Database.selectByColumn(Utility.tables.Bag_Items, Utility.tables.Character_Bags.foreignKey, bag.Id).then(function (itemReferences) {
            angular.forEach(itemReferences, function (itemReference) {
                var item = $filter("filter")(self.items, { Id: itemReference[Utility.tables.Items.foreignKey] }, true);
                if (item.length > 0) {
                    item = item[0];
                    var bagItem = angular.merge(itemReference, {
                        item: item,
                    });
                    bag.items.push(bagItem);
                }
            });
            deferred.resolve();
        })
        return deferred.promise;
    }

    return self;
})