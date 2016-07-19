angular.module("backpack.services.session", [])

.factory("Session", function ($q) {
    var self = this;
    
    self.character = null;
    self.inventory = null;

    return self;
})