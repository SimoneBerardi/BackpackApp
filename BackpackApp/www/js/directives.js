angular.module("backpack.directives", [])

.directive("itemInnerCheckbox", function () {
    return {
        templateUrl: "templates/directives/item-inner-checkbox.html",
        restrict: "E",
        replace: true,
        scope: {
            ngModel: "=",
        },
    };
})