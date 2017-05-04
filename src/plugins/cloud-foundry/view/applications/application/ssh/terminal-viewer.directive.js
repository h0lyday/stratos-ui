(function () {

  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('terminalViewer', terminalViewer);

  /**
   * @name terminalViewer
   */
  function terminalViewer(AnsiColorsService, $websocket, $log) {

    var term;

    var STREAMING_STATUS = {
      NOT_STREAMING: 0,
      ONLINE: 1,
      CONNECTING: 2,
      CLOSED: 3
    };

    // Only one terminal on page at any given time
    function terminalViewerLink(ignore, element) {
      term = new Terminal();
      term.open(element[0]);
      term.write('Hello terminal');

      // Log the keyCode of every keyDown event
      term.textarea.onkeydown = function (e) {
        console.log('User pressed key with keyCode: ', e.keyCode);
      };
    }

    function TerminalViewerController($scope, $window) {
      var terminalViewer = this;

      function closeWebSocket() {
        if (terminalViewer.streaming && terminalViewer.webSocketConnection) {
          terminalViewer.normalClose = true;
          terminalViewer.webSocketConnection.close(true);
        }
      }

      /* eslint-disable angular/no-private-call */
      function safeApply() {
        if ($scope.$$destroyed || $scope.$$phase) {
          return;
        }
        $scope.$apply();
      }
      /* eslint-enable angular/no-private-call */

      function resetLog() {
      }

      // Handle streaming logs
      function requestStreamingLog() {

        console.log('Attempting to connect to web socket stream');
        resetLog();

        var websocketUrl = terminalViewer.websocketUrl;
        if (_.isUndefined(websocketUrl)) {
          return;
        }
        closeWebSocket();
        terminalViewer.streaming = STREAMING_STATUS.CONNECTING;
        terminalViewer.webSocketConnection = $websocket(websocketUrl, null, {
          reconnectIfNotNormalClose: false
        });

        terminalViewer.webSocketConnection.onMessage(function (message) {
          var logData = message.data;

          terminalViewer.term.writer(logData);
        }, {autoApply: false});

        terminalViewer.webSocketConnection.onOpen(function (event) {
          $log.debug('WebSocket connection opened', event);
          logViewer.streaming = STREAMING_STATUS.ONLINE;
          safeApply();
        });

        terminalViewer.webSocketConnection.onClose(function (event) {
          if (!terminalViewer.normalClose) {
            $log.warn('WebSocket connection severed', event);
          }
          terminalViewer.normalClose = false;
          terminalViewer.streaming = STREAMING_STATUS.CLOSED;
          safeApply();
        });
      }

      $scope.$watch('terminalViewer.websocketUrl', function (newVal) {
        if (!_.isUndefined(newVal)) {
          requestStreamingLog();
        }
      });
    }

    // Replace directives are not going anywhere, see:
    // https://github.com/angular/angular.js/commit/eec6394a342fb92fba5270eee11c83f1d895e9fb#commitcomment-8124407
    /* eslint-disable angular/no-directive-replace */
    return {
      restrict: 'E',
      template: '<div class="terminal-container"></div>',
      replace: true,
      scope: {
        websocketUrl: '=?'
      },
      controllerAs: 'terminalViewer',
      bindToController: true,
      link: terminalViewerLink,
      controller: TerminalViewerController
    };
    /* eslint-enable angular/no-directive-replace */
  }
})();
