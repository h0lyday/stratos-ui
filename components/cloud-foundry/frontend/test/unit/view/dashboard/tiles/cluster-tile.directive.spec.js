(function () {
  'use strict';

  describe('endpoints clusters cluster-tile directive', function () {
    var $scope, $q, $state, element, clusterTileCtrl, $compile, cfAPIUsers, cfAPIOrg, consoleInfo;

    var initialService = {
      guid: 'f7fbd0c7-1ce9-4e74-a891-7ffb16453af2',
      name: 'lol',
      cnsi_type: 'cf',
      api_endpoint: {
        Scheme: 'https',
        Opaque: '',
        User: null,
        Host: 'api.cf.stratos.lol',
        Path: '',
        RawPath: '',
        RawQuery: '',
        Fragment: ''
      },
      authorization_endpoint: 'https://login.cf.stratos.lol',
      token_endpoint: 'https://uaa.cf.stratos.lol'
    };

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    beforeEach(inject(function ($injector) {
      $q = $injector.get('$q');
      $state = $injector.get('$state');
      $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();
      var modelManager = $injector.get('modelManager');
      $scope.service = angular.fromJson(angular.toJson(initialService));
      $scope.connect = angular.noop;
      $scope.disconnect = angular.noop;
      $scope.unregister = angular.noop;

      var apiManager = $injector.get('apiManager');
      cfAPIUsers = apiManager.retrieve('cloud-foundry.api.Users');
      cfAPIOrg = apiManager.retrieve('cloud-foundry.api.Organizations');
      consoleInfo = modelManager.retrieve('app.model.consoleInfo');
      var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');

      userServiceInstanceModel.serviceInstances[$scope.service.guid] = {};
    }));

    function createCtrl() {
      var markup = '<cluster-tile service="service" connect="connect" ' +
        'disconnect="disconnect" unregister="unregister"></cluster-tile>';

      element = angular.element(markup);
      $compile(element)($scope);

      $scope.$apply();

      clusterTileCtrl = element.controller('clusterTile');
      spyOn(clusterTileCtrl, 'connect').and.callThrough();
      spyOn(clusterTileCtrl, 'disconnect').and.callThrough();
      spyOn(clusterTileCtrl, 'unregister').and.callThrough();
    }

    describe('defined + initialised', function () {
      it('should be defined', function () {
        createCtrl();

        expect(element).toBeDefined();
      });

      it('check initial state - null', function () {
        createCtrl();

        expect(clusterTileCtrl.orgCount).toBeUndefined();
        expect(clusterTileCtrl.userCount).toBeUndefined();
        expect(clusterTileCtrl.getCardData()).toBeDefined();
        expect(clusterTileCtrl.getCardData().title).toEqual(initialService.name);
      });

      it('check initial state - not null', function () {
        $scope.service.isConnected = true;
        spyOn(cfAPIUsers, 'ListAllUsers').and.returnValue($q.when({ data: { total_results: 1 }}));
        spyOn(cfAPIOrg, 'ListAllOrganizations').and.returnValue($q.when({ data: { total_results: 1 }}));
        _.set(consoleInfo, 'info.endpoints.cf.' + initialService.guid + '.user.admin', true);
        createCtrl();

        expect(clusterTileCtrl.orgCount).toEqual(1);
        expect(clusterTileCtrl.userCount).toEqual(1);
      });
    });

    describe('setUserCount', function () {
      beforeEach(function () {
        spyOn(cfAPIOrg, 'ListAllOrganizations');
      });

      afterEach(function () {
        expect(cfAPIOrg.ListAllOrganizations).not.toHaveBeenCalled();
      });

      it('Not connected, so no call to backend', function () {
        spyOn(cfAPIUsers, 'ListAllUsers');
        createCtrl();

        expect(clusterTileCtrl.userCount).toBeUndefined();
        clusterTileCtrl.service.isConnected = false;
        clusterTileCtrl.setUserCount();
        $scope.$digest();

        expect(clusterTileCtrl.userCount).toBeUndefined();
        expect(cfAPIUsers.ListAllUsers).not.toHaveBeenCalled();
      });

      it('Errored, so no call to backend', function () {
        spyOn(cfAPIUsers, 'ListAllUsers');
        createCtrl();

        expect(clusterTileCtrl.userCount).toBeUndefined();
        clusterTileCtrl.userService.error = false;
        clusterTileCtrl.setUserCount();
        $scope.$digest();

        expect(clusterTileCtrl.userCount).toBeUndefined();
        expect(cfAPIUsers.ListAllUsers).not.toHaveBeenCalled();
      });

      it('Call succeeds', function () {
        spyOn(cfAPIUsers, 'ListAllUsers').and.callFake(function (params, httpConfig) {
          expect(httpConfig.headers['x-cap-cnsi-list']).toEqual(initialService.guid);
          return $q.when({ data: { total_results: 2 }});
        });
        _.set(consoleInfo, 'info.endpoints.cf.' + initialService.guid + '.user.admin', true);
        createCtrl();

        expect(clusterTileCtrl.userCount).toBeUndefined();
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setUserCount();
        $scope.$digest();

        expect(clusterTileCtrl.userCount).toEqual(2);
        expect(cfAPIUsers.ListAllUsers).toHaveBeenCalled();
      });

      it('Call succeeds - empty list', function () {
        spyOn(cfAPIUsers, 'ListAllUsers').and.callFake(function (params, httpConfig) {
          expect(httpConfig.headers['x-cap-cnsi-list']).toEqual(initialService.guid);
          return $q.when({ data: { total_results: 0 }});
        });
        _.set(consoleInfo, 'info.endpoints.cf.' + initialService.guid + '.user.admin', true);
        createCtrl();

        expect(clusterTileCtrl.userCount).toBeUndefined();
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setUserCount();
        $scope.$digest();

        expect(clusterTileCtrl.userCount).toBe(0);
        expect(cfAPIUsers.ListAllUsers).toHaveBeenCalled();
      });

      it('Call fails', function () {
        spyOn(cfAPIUsers, 'ListAllUsers').and.callFake(function (params, httpConfig) {
          expect(httpConfig.headers['x-cap-cnsi-list']).toEqual(initialService.guid);
          return $q.reject();
        });
        _.set(consoleInfo, 'info.endpoints.cf.' + initialService.guid + '.user.admin', true);
        createCtrl();

        expect(clusterTileCtrl.userCount).toBeUndefined();
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setUserCount();
        $scope.$digest();

        expect(clusterTileCtrl.userCount).toBeUndefined();
        expect(cfAPIUsers.ListAllUsers).toHaveBeenCalled();
      });

      it('Not admin', function () {
        spyOn(cfAPIUsers, 'ListAllUsers');
        _.set(consoleInfo, 'info.endpoints.cf.' + initialService.guid + '.user.admin', false);
        createCtrl();

        expect(clusterTileCtrl.userCount).toBeUndefined();
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setUserCount();
        $scope.$digest();

        expect(clusterTileCtrl.userCount).toBeUndefined();
        expect(cfAPIUsers.ListAllUsers).not.toHaveBeenCalled();
      });
    });

    describe('setOrganisationCount', function () {
      beforeEach(function () {
        spyOn(cfAPIUsers, 'ListAllUsers');
      });

      afterEach(function () {
        expect(cfAPIUsers.ListAllUsers).not.toHaveBeenCalled();
      });

      it('Not connected, so no call to backend', function () {
        spyOn(cfAPIOrg, 'ListAllOrganizations');
        createCtrl();

        expect(clusterTileCtrl.orgCount).toBeUndefined();
        clusterTileCtrl.service.isConnected = false;
        clusterTileCtrl.setOrganisationCount();
        $scope.$digest();

        expect(clusterTileCtrl.orgCount).toBeUndefined();
        expect(cfAPIOrg.ListAllOrganizations).not.toHaveBeenCalled();
      });

      it('Errored, so no call to backend', function () {
        spyOn(cfAPIOrg, 'ListAllOrganizations');
        createCtrl();

        expect(clusterTileCtrl.orgCount).toBeUndefined();
        clusterTileCtrl.userService.error = true;
        clusterTileCtrl.setOrganisationCount();
        $scope.$digest();

        expect(clusterTileCtrl.orgCount).toBeUndefined();
        expect(cfAPIOrg.ListAllOrganizations).not.toHaveBeenCalled();
      });

      it('Call succeeds', function () {
        spyOn(cfAPIOrg, 'ListAllOrganizations').and.callFake(function (params, httpConfig) {
          expect(httpConfig.headers['x-cap-cnsi-list']).toEqual(initialService.guid);
          return $q.when({ data: { total_results: 2 }});
        });
        createCtrl();

        expect(clusterTileCtrl.orgCount).toBeUndefined();
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setOrganisationCount();
        $scope.$digest();

        expect(clusterTileCtrl.orgCount).toEqual(2);
        expect(cfAPIOrg.ListAllOrganizations).toHaveBeenCalled();
      });

      it('Call succeeds - empty list', function () {
        spyOn(cfAPIOrg, 'ListAllOrganizations').and.callFake(function (params, httpConfig) {
          expect(httpConfig.headers['x-cap-cnsi-list']).toEqual(initialService.guid);
          return $q.when({ data: { total_results: 0 }});
        });
        createCtrl();

        expect(clusterTileCtrl.orgCount).toBeUndefined();
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setOrganisationCount();
        $scope.$digest();

        expect(clusterTileCtrl.orgCount).toBe(0);
        expect(cfAPIOrg.ListAllOrganizations).toHaveBeenCalled();
      });

      it('Call fails', function () {
        spyOn(cfAPIOrg, 'ListAllOrganizations').and.callFake(function (params, httpConfig) {
          expect(httpConfig.headers['x-cap-cnsi-list']).toEqual(initialService.guid);
          return $q.reject();
        });
        createCtrl();

        expect(clusterTileCtrl.orgCount).toBeUndefined();
        clusterTileCtrl.service.isConnected = true;
        clusterTileCtrl.setOrganisationCount();
        $scope.$digest();

        expect(clusterTileCtrl.orgCount).toBeUndefined();
        expect(cfAPIOrg.ListAllOrganizations).toHaveBeenCalled();
      });
    });

    describe('summary', function () {
      it('correctly executed', function () {
        createCtrl();

        spyOn($state, 'go');
        clusterTileCtrl.summary();
        expect($state.go.calls.argsFor(0)).toEqual(['endpoint.clusters.cluster.detail.organizations', {guid: initialService.guid, orgCount: undefined, userCount: undefined}]);
        expect($state.go.calls.count()).toEqual(1);

      });
    });

  });

})();
