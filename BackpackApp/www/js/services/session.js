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
            var promises = [];
            promises.push(self.loadValues(self.characters, Utility.tables.Characters));
            promises.push(self.loadValues(self.categories, Utility.tables.Categories));
            promises.push(self.loadValues(self.tags, Utility.tables.Tags));
            promises.push(self.loadValues(self.items, Utility.tables.Items));

            if (Utility.version == "3.5")
                promises.push(self.loadValues(self.loads, Utility.tables.Loads));

            $q.all(promises).then(function () {
                self._loadCategories(self.categories);
                self.isInitialized = true;
                deferred.resolve();
            });
        });

        return deferred.promise;
    };
    self.loadValues = function (array, table) {
        var deferred = $q.defer();
        Database.selectAll(table).then(function (result) {
            angular.merge(array, result);
            deferred.resolve();
        })
        return deferred.promise;
    };
    self.selectCharacter = function (character) {
        var deferred = $q.defer();
        self.character = null;
        self.bags.splice(0, self.bags.length);

        if (Utility.version == "3.5") {
            var load = $filter("filter")(self.loads, { Strength: character.Strength }, true)[0];
            character.load = load;
        } else if (Utility.version == "5") {
            character.load = {
                Light: character.Strength * 5,
                Medium: character.Strength * 10,
                Heavy: character.Strength * 15,
            }
        }

        self.character = character;
        //Carico le borse
        Database.selectByColumn(Utility.tables.Character_Bags, Utility.tables.Characters.foreignKey, character.Id).then(function (bags) {
            var promises = [];
            angular.forEach(bags, function (bag) {
                promises.push(self._loadBag(bag));
            });
            $q.all(promises).then(function () {
                angular.merge(self.bags, bags);
                deferred.resolve();
            });
        });

        return deferred.promise;
    };


    //---Metodi di utility---
    self.getTag = function (id) {
        return $filter("filter")(self.tags, { Id: id }, true)[0];
    };
    self.getCharacter = function (id) {
        return $filter("filter")(self.characters, { Id: id }, true)[0];
    };
    self.getCharacterSize = function () {
        return $filter("filter")(Utility.sizes, { id: self.character.Size }, true)[0].name;
    };
    self.getBagItem = function (bag, item) {
        return $filter("filter")(bag.items, function (bagItem, index, array) {
            return bagItem[Utility.tables.Items.foreignKey] == item.Id;
        }, true);
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
    self.getBagItemBag = function (bagItem) {
        return $filter("filter")(self.bags, { Id: bagItem[Utility.tables.Character_Bags.foreignKey] }, true)[0];
    };
    self.getBag = function (id) {
        return $filter("filter")(self.bags, { Id: id }, true)[0];
    };


    //---Metodi database---
    //Tags
    self.deleteTag = function (tag) {
        var deferred = $q.defer();
        Database.deleteById(Utility.tables.Tags, tag.Id).then(function () {
            Database.deleteBycolumn(Utility.tables.Item_Tags, Utility.tables.Tags.foreignKey, tag.Id).then(function () {
                var index = self.tags.indexOf(tag);
                self.tags.splice(index, 1);
                deferred.resolve();
            })
        })
        return deferred.promise;
    };
    self.addOrModifyTag = function (tag) {
        var deferred = $q.defer();
        Database.insertOrReplace(Utility.tables.Tags, tag).then(function (result) {
            tag.Id = result.insertId;
            var oldTag = self.getTag(tag.Id);
            if (oldTag != undefined)
                angular.merge(oldTag, tag);
            else
                self.tags.push(tag);
            deferred.resolve();
        })
        return deferred.promise;
    };
    //Character
    self.deleteCharacter = function (character) {
        var deferred = $q.defer();
        Database.deleteById(Utility.tables.Characters, character.Id).then(function () {
            Database.selectByColumn(Utility.tables.Character_Bags, Utility.tables.Characters.foreignKey, character.Id).then(function (bags) {
                var promises = [];
                angular.forEach(bags, function (bag) {
                    promises.push(Database.deleteBycolumn(Utility.tables.Bag_Items, Utility.tables.Character_Bags.foreignKey, bag.Id));
                })

                $q.all(promises).then(function () {
                    Database.deleteBycolumn(Utility.tables.Character_Bags, Utility.tables.Characters.foreignKey, character.Id).then(function () {
                        var index = self.characters.indexOf(character);
                        self.characters.splice(index, 1);
                        deferred.resolve();
                    });
                })
            })
        });
        return deferred.promise;
    };
    self.addOrModifyCharacter = function (character) {
        var deferred = $q.defer();
        Database.insertOrReplace(Utility.tables.Characters, character).then(function (result) {
            character.Id = result.insertId;
            var oldCharacter = self.getCharacter(character.Id);
            if (oldCharacter != undefined) {
                angular.merge(oldCharacter, character);
                deferred.resolve();
            }
            else {
                var equippedBag = {
                    Id: -1,
                    Name: "Equipaggiato",
                    Capacity: 0.0,
                    Weight: 0.0,
                    HasFixedWeight: 0,
                    IsEquipped: 1,
                    IsMain: 0,
                    Image: "",
                }
                equippedBag[Utility.tables.Characters.foreignKey] = character.Id;
                var mainBag = {
                    Id: -1,
                    Name: "Zaino",
                    Capacity: 0.0,
                    Weight: 2.5,
                    HasFixedWeight: 0,
                    IsEquipped: 0,
                    IsMain: 1,
                    Image: "",
                }
                mainBag[Utility.tables.Characters.foreignKey] = character.Id;
                self.addOrModifyBag(equippedBag, character).then(function () {
                    return self.addOrModifyBag(mainBag, character);
                }).then(function () {
                    self.characters.push(character);
                    deferred.resolve();
                });
            }
        });
        return deferred.promise;
    };
    //Bag
    self.deleteBag = function (bag) {
        var deferred = $q.defer();
        Database.deleteById(Utility.tables.Character_Bags, bag.Id).then(function () {
            Database.deleteBycolumn(Utility.tables.Bag_Items, Utility.tables.Character_Bags.foreignKey, bag.Id).then(function () {
                var index = self.bags.indexOf(bag);
                self.bags.splice(index, 1);
                if (bag.IsMain == 1 && self.bags.length > 0) {
                    self.bags[index - 1].IsMain = 1;
                }
                deferred.resolve();
            });
        });
        return deferred.promise;
    };
    self.addOrModifyBag = function (bag, character) {
        if (character == undefined)
            character = self.character;
        var deferred = $q.defer();
        bag[Utility.tables.Characters.foreignKey] = character.Id,
        Database.insertOrReplace(Utility.tables.Character_Bags, bag).then(function (result) {
            bag.Id = result.insertId;
            var oldBag = self.getBag(bag.Id);
            if (oldBag != undefined)
                angular.merge(oldBag, bag);
            else {
                bag.items = [];
                self.bags.push(bag);
            }
            deferred.resolve();
        });
        return deferred.promise;
    };
    //BagItem
    self.moveBagItem = function (sourceBag, destBag, bagItem, quantity) {
        var deferred = $q.defer();
        self.removeBagItem(bagItem, quantity).then(function () {
            self.addBagItem(destBag, bagItem.item, quantity).then(function () {
                deferred.resolve();
            })
        })
        return deferred.promise;
    };
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
    };
    self.removeBagItem = function (bagItem, quantity) {
        var deferred = $q.defer();
        if (bagItem.Quantity > quantity) {
            bagItem.Quantity -= quantity;
            Database.insertOrReplace(Utility.tables.Bag_Items, bagItem).then(function (result) {
                deferred.resolve();
            });
        }
        else {
            Database.deleteById(Utility.tables.Bag_Items, bagItem.Id).then(function (result) {
                var bag = self.getBagItemBag(bagItem);
                var index = bag.items.indexOf(bagItem);
                bag.items.splice(index, 1);
                deferred.resolve();
            })
        }
        return deferred.promise;
    };
    //Item
    self.deleteItem = function (item) {
        var deferred = $q.defer();
        Database.deleteById(Utility.tables.Items, item.Id).then(function () {
            Database.deleteBycolumn(Utility.tables.Item_Tags, Utility.tables.Items.foreignKey, item.Id).then(function () {
                var index = self.items.indexOf(item);
                self.items.splice(index, 1);
                angular.forEach(self.bags, function (bag) {
                    var bagItem = self.getBagItem(bag, item);
                    if (bagItem.length > 0) {
                        bagItem = bagItem[0];
                        index = bag.items.indexOf(bagItem);
                        bag.items.splice(index, 1);
                    }
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
            var oldItem = self.getItem(item.Id);
            if (oldItem != undefined)
                angular.merge(oldItem, item);
            else
                self.items.push(item);

            //Salvo i tag su db
            angular.forEach(item.tags, function (tag) {
                if (tag.value != tag.initialValue) {
                    if (tag.initialValue) {
                        promises.push(Database.deleteById(Utility.tables.Item_Tags, tag.Id));
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