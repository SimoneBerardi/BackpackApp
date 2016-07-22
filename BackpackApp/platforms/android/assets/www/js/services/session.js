angular.module("backpack.services.session", [])

.factory("Session", function ($q, $state, $filter, Database, Utility) {
    var self = this;

    self.isInitialized = false;
    self.characters = [];
    self.items = [];

    self.character = null;
    self.bags = [];

    self.init = function () {
        var deferred = $q.defer();
        Database.init().then(function () {
            Database.selectAll(Utility.tables.characters.name).then(function (characters) {
                //Carico i personaggi
                angular.forEach(characters, function (character) {
                    character.sizeName = Utility.sizes[character.Size];
                });
                self.characters = characters;

                Database.selectAll(Utility.tables.items.name).then(function (items) {
                    //Carico gli oggetti
                    self.items = items;

                    self.isInitialized = true;
                    deferred.resolve();
                })
            })
        })
        return deferred.promise;
    };
    self.selectCharacter = function (character) {
        var deferred = $q.defer();
        self.character = character;
        //Carico le borse
        Database.selectByColumn(Utility.tables.bags.name, Utility.tables.characters.foreignKey, character.Id).then(function (bags) {
            var promises = [];
            angular.forEach(bags, function (bag) {
                bag.items = [];
                bag.isOpen = true;
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
        Database.selectByColumn(Utility.tables.bagItems.name, Utility.tables.bags.foreignKey, bag.Id).then(function (itemReferences) {
            angular.forEach(itemReferences, function (itemReference) {
                var item = $filter("filter")(self.items, { Id: itemReference[Utility.tables.items.foreignKey] }, true);
                if (item.length > 0) {
                    bag.items.push(angular.merge(itemReference, item[0]));
                }
                //TODO Aggiungere bag items tags per associare tag aggiuntivi agli oggetti in una borsa
            });
            deferred.resolve();
        })
        return deferred.promise;
    }

    return self;
})