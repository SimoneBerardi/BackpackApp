angular.module("backpack.services.session", [])

.factory("Session", function ($q, $state, $filter, Database, Utility) {
    var self = this;

    self.isInitialized = false;

    self.loads = [];
    self.characters = [];
    self.items = [];
    self.categories = [];

    self.character = null;
    self.bags = [];

    self.init = function () {
        var deferred = $q.defer();
        Database.init().then(function () {
            Database.selectAll(Utility.tables.loads.name).then(function (loads) {
                self.loads = loads;
                Database.selectAll(Utility.tables.characters.name).then(function (characters) {
                    //Carico i personaggi
                    angular.forEach(characters, function (character) {
                        character.sizeName = Utility.sizes[character.Size];
                    });
                    self.characters = characters;

                    //Carico gli oggetti
                    Database.selectAll(Utility.tables.items.name).then(function (items) {
                        self.items = items;
                        //Carico le categorie degli oggetti
                        Database.selectAll(Utility.tables.categories.name).then(function (categories) {
                            self.categories = categories;
                            self.loadCategories(self.categories);

                            //Inizializzazione completata
                            self.isInitialized = true;
                            deferred.resolve();
                        });
                    })
                })
            })
        })
        return deferred.promise;
    };
    self.loadCategories = function (categories) {
        angular.forEach(categories, function (category) {

            category.isOpen = true;

            var categoryItems = $filter("filter")(self.items, function (value, index, array) {
                return value[Utility.tables.categories.foreignKey] == category.Id;
            }, true);
            category.items = categoryItems;
        })
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
                promises.push(self.loadBag(bag));
            });
            $q.all(promises).then(function () {
                self.bags = bags;
                deferred.resolve();
            });
        });

        return deferred.promise;
    };
    self.loadBag = function (bag) {
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
                    bagItem.IsModified = bagItem.IsModified == 1;
                    bag.items.push(bagItem);
                }
                //TODO Aggiungere bag items tags per associare tag aggiuntivi agli oggetti in una borsa
            });
            deferred.resolve();
        })
        return deferred.promise;
    }

    return self;
})