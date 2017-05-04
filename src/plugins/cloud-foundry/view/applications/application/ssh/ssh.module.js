(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.ssh', [])
    .config(registerRoute)
    .run(registerAppTab);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.ssh', {
      url: '/ssh',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/ssh/ssh.html',
      controller: ApplicationSSHController,
      controllerAs: 'applicationSSHController'
    });
  }

  function registerAppTab($stateParams, $q, cfApplicationTabs) {
    cfApplicationTabs.tabs.push({
      position: 8,
      hide: function () {
        return false;
      },
      uiSref: 'cf.applications.application.ssh',
      label: 'SSH',
      clearState: function () {
      }
    });
  }

  // ApplicationSSHController.$inject = [
  //   '$q',
  //   '$interpolate',
  //   '$stateParams',
  //   '$scope',
  //   '$location'
  //   '$state',
  //   'modelManager',
  //   'frameworkDialogConfirm',
  //   'appNotificationsService',
  //   'appUtilsService'
  // ];

  /**
   * @name ApplicationVersionsController
   * @constructor
   * @param {object} $q - angular $q service
   * @param {object} $interpolate - the angular $interpolate service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $scope - the angular $scope service
   * @param {object} $timeout - the angular $timeout service
   * @param {object} $state - the UI router $state service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} frameworkDialogConfirm - the confirm dialog service
   * @param {app.view.appNotificationsService} appNotificationsService - the toast notification service
   * @param {object} appUtilsService - appUtilsService service
   * @property {object} $q - angular $q service
   * @property {object} $interpolate - the angular $interpolate service
   * @property {object} versionModel - the Cloud Foundry Application Versions Model
   * @property {string} cnsiGuid - the HCF Endpoint GUID
   * @property {string} id - the application GUID
   * @property {object} frameworkDialogConfirm - the confirm dialog service
   */
  function ApplicationSSHController($q, $interpolate, $stateParams, $scope, $location) {
    this.$q = $q;
    this.$interpolate = $interpolate;
    this.cnsiGuid = $stateParams.cnsiGuid;
    this.id = $stateParams.guid;

    console.log($location);

    // var term = new Terminal();
    // term.open(document.getElementById('terminal'));
    // term.write('Hello terminal');

    var protocol = $location.protocol() === 'https' ? 'wss' : 'ws';
    this.websocketUrl = protocol + '://' + $location.host() + ':' + $location.port() + '/pp/v1/' +
      $stateParams.cnsiGuid + '/apps/' + $stateParams.guid + '/stream';

    console.log("Set webscoket url");
    console.log(this.websocketUrl);
  }

  angular.extend(ApplicationSSHController.prototype, {
  });
})();
