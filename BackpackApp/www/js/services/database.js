angular.module("backpack.services.database", [])

.factory("Database", function ($q, $http, $log) {
    var self = this;

    //Variabili
    self.dbName = "backpack.db";
    self.db = null;
    self.tables = null,

    //Metodi pubblici
    self.init = function () {
        var deferred = $q.defer();
        //return self._loadDatabase().then(function () {
        //    self.db = sqlitePlugin.openDatabase("backpack.db", "1.0", "", 1);
        //});

        //Debug
        self._loadBrowserDatabase().then(function () {
            self._getTables().then(function (tables) {
                var promises = [];
                self.tables = {};
                angular.forEach(tables, function (table) {
                    if (table.name[0] != "_") {
                        promises.push(self._selectAll(table.name).then(function (values) {
                            self.tables[table.name] = [];
                            angular.merge(self.tables[table.name], values);
                        }));
                    }
                });
                $q.all(promises).then(function () {
                    deferred.resolve();
                });
            });
        });

        return deferred.promise;
    };

    //Metodi privati
    self._getTables = function () {
        var query = "SELECT name FROM sqlite_master WHERE type='table'";
        return self._query(query);
    };
    self._selectAll = function (table) {
        var query = "SELECT * FROM " + table;
        return self._query(query);
    };
    //Carica il database su browser
    self._loadBrowserDatabase = function () {
        var deferred = $q.defer();
        var promises = [];
        self.db = window.openDatabase("backpack.db", "1.0", "database", -1);
        promises.push(self._createTables());
        promises.push(self._populateTable("Items"));
        promises.push(self._populateTable("Loads"));
        $q.all(promises).then(function () {
            deferred.resolve();
        });
        return deferred.promise;
    };
    self._createTables = function () {
        var deferred = $q.defer();
        var promises = [];
        $http.get("data/database.json").success(function (data) {
            angular.forEach(data.tables, function (table) {
                promises.push(self._query(table.create));
            });
            $q.all(promises).then(function () {
                deferred.resolve();
            })
        });
        return deferred.promise;
    };
    self._populateTable = function (name) {
        var deferred = $q.defer();
        var promises = [];
        $http.get("data/" + name + ".txt").success(function (data) {
            var lines = data.split("\n");
            var columns = lines[0];
            lines.splice(0, 1);
            angular.forEach(lines, function (line) {
                var query = "INSERT OR REPLACE INTO " + name + " (" + columns + ") VALUES(";
                angular.forEach(line.split(","), function (cell) {
                    query += "\"" + cell + "\",";
                });
                query = query.slice(0, -1);
                query += ")";
                promises.push(self._query(query));
            });
            $q.all(promises).then(function () {
                deferred.resolve();
            })
        });

        return deferred.promise;
    };
    //Esegue una query su database
    self._query = function (query, bindings) {
        bindings = typeof bindings !== "undefined" ? bindings : [];
        var deferred = $q.defer();
        self.db.transaction(function (transaction) {
            transaction.executeSql(query, bindings, function (transaction, result) {
                var output = [];
                angular.forEach(result.rows, function (row) {
                    output.push(row);
                });
                deferred.resolve(output);
            }, function (transaction, error) {
                $log.log(error.message);
                deferred.reject(error);
            });
        });
        return deferred.promise;
    };
    //Carica il database su dispositivo se non presente
    self._loadDatabase = function () {
        var deferred = $q.defer();
        var sourceFileName = cordova.file.applicationDirectory + "www/data/" + this.dbName;
        var targetDirName = cordova.file.dataDirectory;
        return $q.all([
            self._getFile(sourceFileName),
            self._getFile(targetDirName),
        ]).then(function (files) {
            var sourceFile = files[0];
            var targetDir = files[1];
            self._checkFile(targetDir, self.dbName).then(function () {
                $log.log("Database already copied");
            }, function () {
                $log.log("Database not present, copying it");
                self._copyFile(targetDir, sourceFile).then(function () {
                    $log.log("Database file copied!");
                })
            });
        });
        return deferred.promise;
    };
    //Copia un file in una cartella
    self._copyFile = function (dir, file) {
        var deferred = $q.defer();
        file.copyTo(dir, file.name,
            function () {
                deferred.resolve();
            }, function () {
                deferred.reject();
            })
        return deferred.promise;
    };
    //Controlla la presenza di un file in una cartella
    self._checkFile = function (dir, fileName) {
        var deferred = $q.defer();
        dir.getFile(fileName, {},
            function () {
                deferred.resolve();
            }, function () {
                deferred.reject();
            });
        return deferred.promise;
    };
    //Recupera un oggetto file dal suo url
    self._getFile = function (name) {
        var deferred = $q.defer();
        resolveLocalFileSystemURL(name,
            function (file) {
                deferred.resolve(file);
            }, function (error) {
                deferred.reject(error);
            });
        return deferred.promise;
    }

    return self;
})