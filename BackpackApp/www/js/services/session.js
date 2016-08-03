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
            return Database.selectAll(Utility.tables.loads.name);
        }).then(function (loads) {
            self.loads = loads;
            return Database.selectAll(Utility.tables.characters.name);
        }).then(function (characters) {
            //Carico i personaggi
            angular.forEach(characters, function (character) {
                character.sizeName = Utility.sizes[character.Size];
            });
            self.characters = characters;
            //Carico gli oggetti
            return Database.selectAll(Utility.tables.items.name);
        }).then(function (items) {
            angular.forEach(items, function (item) {
                item.IsCustom = item.IsCustom == 1;
                item.IsUnidentified = item.IsUnidentified == 1;
            })
            self.items = items;
            //Carico le categorie degli oggetti
            return Database.selectAll(Utility.tables.categories.name);
        }).then(function (categories) {
            self.categories = categories;
            self._loadCategories(self.categories);
            //Carico i tags
            return Database.selectAll(Utility.tables.tags.name);
        }).then(function (tags) {
            self.tags = tags;

            //Inizializzazione completata
            self.isInitialized = true;
            deferred.resolve();
        });
        return deferred.promise;
    };
    self.removeBagItemPopup = function (bag, item, quantity) {
        Utility.confirmDelete(quantity, item.Name, function () {
            self.removeBagItem(bag, item, quantity);
        })
    };
    self.getItemTags = function (id) {
        var deferred = $q.defer();
        Database.selectByColumn(Utility.tables.itemTags.name, Utility.tables.items.foreignKey, id).then(function (itemTags) {
            var tags = [];
            angular.forEach(self.tags, function (tag) {
                var hasTag = $filter("filter")(self.tags, function (value, index, array) {
                    return value[Utility.tables.foreignKey] == tag.Id;
                }, true);
                tags.push({
                    name: tag.Name,
                    value: (hasTag.length > 0),
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
        Database.selectByColumn(Utility.tables.bags.name, Utility.tables.characters.foreignKey, character.Id).then(function (bags) {
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
    self.removeBagItem = function (bag, item, quantity) {
        var bagItem = $filter("filter")(bag.items, { Id: item.Id }, true)[0];
        if (bagItem.Quantity > quantity)
            bagItem.Quantity -= quantity;
        else {
            var index = bag.items.indexOf(item);
            bag.items.splice(index, 1);
        }
    };
    self.addOrModifyItem = function (item) {
        var deferred = $q.defer();
        //TODO salvare su db i tags e caricarli nelle tabelle corrette
        Database.insertOrReplace(Utility.tables.items.name, item).then(function (result) {
            item.Id = result.insertId;
            var oldItem = $filter("filter")(self.items, { Id: item.Id }, true);
            if (oldItem.length > 0) {
                var index = self.items.indexOf(oldItem);
                self.items.splice(index, 1);
                var categoryIndex = self.categories[0].items.indexOf(item);
                self.categories[0].items.splice(categoryIndex, 1);
            }
            self.items.push(item);
            self.categories[0].items.push(item);
            deferred.resolve();
        });
        return deferred.promise;
    };
    //---Metodi privati---
    self._loadCategories = function (categories) {
        angular.forEach(categories, function (category) {

            category.isOpen = true;

            var categoryItems = $filter("filter")(self.items, function (value, index, array) {
                return value[Utility.tables.categories.foreignKey] == category.Id;
            }, true);
            category.items = categoryItems;
        })
    };
    self._loadBag = function (bag) {
        var deferred = $q.defer();

        bag.items = [];
        bag.isOpen = true;
        bag.HasFixedWeight = bag.HasFixedWeight == 1;
        bag.IsEquipped = bag.IsEquipped == 1;
        bag.IsMain = bag.IsMain == 1;

        Database.selectByColumn(Utility.tables.bagItems.name, Utility.tables.bags.foreignKey, bag.Id).then(function (itemReferences) {
            angular.forEach(itemReferences, function (itemReference) {
                var item = $filter("filter")(self.items, { Id: itemReference[Utility.tables.items.foreignKey] }, true);
                if (item.length > 0) {
                    var bagItem = angular.merge(itemReference, item[0]);
                    bag.items.push(bagItem);
                }
            });
            deferred.resolve();
        })
        return deferred.promise;
    }

    return self;
})