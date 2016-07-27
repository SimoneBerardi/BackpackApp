angular.module('backpack.extensions', ['ionic'])

.decorator('$ionicPopup', function $ionicPopupDecorator($delegate, $controller, $rootScope) {
    "use strict";

    var POPUP_EXTENDED_PARAMS = ['controller', 'locals', 'scope'];

    var $ionicPopup = $delegate;
    var $enhancedIonicPopup = {};

    angular.extend($enhancedIonicPopup, $ionicPopup, {
        show: decoratePopupFn('show'),
        alert: decoratePopupFn('alert'),
        confirm: decoratePopupFn('confirm'),
        prompt: decoratePopupFn('prompt')
    });

    return $enhancedIonicPopup;

    function decoratePopupFn(fnName) {
        return function (config) {
            var _config = config || {}
              , controllerOptions = _.pick(_config, POPUP_EXTENDED_PARAMS)
              , popupPromise
              , $dialog = {
                  close: close
              }
            ;

            /**
             *
             * Inject controller for the popup with the following additional injectables.
             *
             * - locals:  A simple javascript object that can be injected into the
             *            controller.
             * - $dialog: A service with a `close` function that can used to close
             *            the dialog form within the controller.
             *            The popup promise is resolved with the supplied argument to the
             *            `close` function.
             *
             *  Sample popup controller.
             *  ---------------------------------
             *  function SelectPopupController ($scope, locals, $dialog) {
             *    $scope.selectItems = locals.selectItems;
             *  
             *    $scope.cancel = function () {
             *      $dialog.close({action: 'close'})
             *    }
             *  
             *    $select.onItemSelect = function(item) {
             *      $dialog.close({action: 'select', value: item})
             *    }
             *  }
             *  ---------------------------------
             */
            if (controllerOptions.controller) {
                _config.scope = _config.scope ?
                  _config.scope.$new() : $rootScope.$new();

                $controller(controllerOptions.controller, angular.extend({},
                  _config.locals,
                  {
                      locals: _config.locals,
                      $scope: _config.scope,
                      $dialog: $dialog
                  }
                ));
            }

            popupPromise = $ionicPopup[fnName](_config);

            return popupPromise;

            function close(result) {
                popupPromise && popupPromise.close(result);
            }
        };
    }
})