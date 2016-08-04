angular.module("backpack.services.database", [])

.factory("Database", function ($q, $http, $log, $filter, Utility) {
    var self = this;

    //Variabili
    self.dbName = "backpack.db";
    self.db = null;

    //Metodi pubblici
    self.init = function () {
        var deferred = $q.defer();
        self._loadDatabase()
        .then(function () {
            deferred.resolve();
        });
        return deferred.promise;
    };
    self.selectAll = function (table) {
        var query = "SELECT * FROM " + table.name;
        return self._query(query);
    };
    self.selectByColumn = function (table, column, value) {
        var query = "SELECT * FROM " + table.name + " WHERE " + column + " = ?";
        return self._query(query, [value]);
    }
    self.selectById = function (table, id) {
        var query = "SELECT * FROM " + table.name + " WHERE Id = ?";
        return self._query(query, [id]);
    }
    self.insertOrReplace = function (table, element) {
        var query = "INSERT OR REPLACE INTO " + table.name + " VALUES (";
        angular.forEach(table.columns, function (column) {
            if (column == "Id" && element[column] == -1)
                query += " NULL, ";
            else
                query += "\"" + element[column] + "\", ";
        })
        query = query.slice(0, -2);
        query += ")";
        return self._query(query, null, false);
    }
    self.deleteById = function (table, id) {
        var query = "DELETE FROM " + table.name + " WHERE Id = ?";
        return self._query(query, [id]);
    }
    self.deleteBycolumn = function (table, column, value) {
        var query = "DELETE FROM " + table.name + " WHERE " + column + " = ?";
        return self._query(query, [value]);
    }

    //Metodi privati
    self._getTableColumns = function (table) {
        var deferred = $q.defer();
        if (Utility.isDebugging) {
            deferred.resolve(table.columns);
        } else {
            var query = "PRAGMA table_info(" + table.name + ")";
            self._query(query).then(function (result) {
                deferred.resolve(result);
            });
        }
        return deferred.promise;
    }
    self._loadDatabase = function () {
        if (Utility.isDebugging)
            return self._loadBrowserDatabase();
        else
            return self._loadNativeDatabase();
    };
    self._loadNativeDatabase = function () {
        //TODO caricare le tabelle tramite query su db
        var deferred = $q.defer();
        self._initializeNativeDatabase().then(function () {
            self.db = sqlitePlugin.openDatabase(self.dbName, "1.0", "", 1);
            deferred.resolve();
        })
        return deferred.promise;
    }
    //Carica il database su browser
    self._loadBrowserDatabase = function () {
        var deferred = $q.defer();

        self.db = window.openDatabase(self.dbName, "1.0", "database", -1);
        self._createTables().then(function () {
            deferred.resolve();
        });

        return deferred.promise;
    };
    self._createTables = function () {
        var deferred = $q.defer();
        var promises = [];
        $http.get("data/database.json").success(function (data) {
            angular.forEach(data.tables, function (table) {
                promises.push(self._loadTableJson(table));
            });
            $q.all(promises).then(function () {
                deferred.resolve();
            })
        });
        return deferred.promise;
    };
    self._loadTableJson = function (table) {
        var deferred = $q.defer();
        self._deleteTable(table.name)
        .then(function () {
            return self._query(table.create);
        })
        .then(function () {
            return self._populateTable(table);
        })
        .then(function () {
            deferred.resolve();
        });
        return deferred.promise;
    };
    self._deleteTable = function (name) {
        var query = "DROP TABLE IF EXISTS " + name;
        return self._query(query);
    };
    self._populateTable = function (table) {
        var deferred = $q.defer();
        var promises = [];
        if (table.data != "")
            $http.get(table.data).success(function (data) {
                var lines = data.split("\r\n");
                var columns = lines[0];
                lines.splice(0, 1);
                Utility.tables[table.name] = {
                    name: table.name,
                    foreignKey: table.foreignKey,
                    columns: columns.split(","),
                }
                angular.forEach(lines, function (line) {
                    var query = "INSERT OR REPLACE INTO " + table.name + " (" + columns + ") VALUES(";
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
        else
            deferred.resolve();

        return deferred.promise;
    };
    //Esegue una query su database
    self._query = function (query, bindings, isQuery) {
        var deferred = $q.defer();
        if (isQuery == undefined)
            isQuery = true;

        bindings = typeof bindings !== "undefined" ? bindings : [];
        self.db.transaction(function (transaction) {
            transaction.executeSql(query, bindings, function (transaction, result) {
                if (isQuery) {
                    var output = [];
                    for (var i = 0; i < result.rows.length; i++) {
                        output.push(result.rows.item(i));
                    }
                    deferred.resolve(output);
                } else
                    deferred.resolve(result);
            }, function (transaction, error) {
                $log.log("Errore in query: " + query);
                $log.log(error.message);
                deferred.reject(error);
            });
        });
        return deferred.promise;
    };
    //Carica il database su dispositivo se non presente
    self._initializeNativeDatabase = function () {
        var deferred = $q.defer();
        var sourceFileName = cordova.file.applicationDirectory + "www/data/" + this.dbName;
        var targetDirName = cordova.file.dataDirectory;
        $q.all([
            self._getFile(sourceFileName),
            self._getFile(targetDirName),
        ]).then(function (files) {
            var sourceFile = files[0];
            var targetDir = files[1];
            self._checkFile(targetDir, self.dbName).then(function () {
                $log.log("Database already copied");
                deferred.resolve();
            }, function () {
                $log.log("Database not present, copying it");
                self._copyFile(targetDir, sourceFile).then(function () {
                    $log.log("Database file copied!");
                    deferred.resolve();
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