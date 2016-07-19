angular.module("backpack.services.loader", [])

.factory("Loader", function ($ionicLoading) {
    var self = this;
    self.show = function () {
        $ionicLoading.show({
            template: "<ion-spinner></ion-spinner>",
            noBackdrop: true
        })
    }

    self.hide = function () {
        $ionicLoading.hide();
    }

    return self;
})