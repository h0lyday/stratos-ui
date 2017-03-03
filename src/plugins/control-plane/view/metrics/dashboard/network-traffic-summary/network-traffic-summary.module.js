(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.network-traffic-summary', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.network-traffic-summary', {
      url: '/network-traffic',
      params: {
        guid: ''
      },
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/network-traffic-summary/network-traffic-summary.html',
      controller: NetworkTrafficController,
      controllerAs: 'networkTrafficCtrl',
      ncyBreadcrumb: {
        label: '{{metricsDashboardCtrl.endpoint.name}}',
        parent: 'cp.tiles'
      }
    });
  }

  NetworkTrafficController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function NetworkTrafficController($q, $state, $stateParams, modelManager, utilsService, metricsDataService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('control-plane.model.metrics');
    this.utilsService = utilsService;
    this.guid = $stateParams.guid;
    this.metricsDataService = metricsDataService;
    this.sortFilters = [
      {
        label: gettext('Hostname'),
        value: 'spec.hostname'
      },
      {
        label: gettext('Data Transmitted Rate'),
        value: 'metric.dataTxRate'
      },
      {
        label: gettext('Data Received Rate'),
        value: 'metric.dataRxRate'
      }
    ];

    this.defaultFilter = {
      label: gettext('Hostname'),
      value: 'spec.hostname'
    };

    this.all = {
      metrics: {}
    };
    if (!_.has(metricsDataService, 'dataTrafficRate.showCardLayout')) {
      this.metricsDataService.dataTrafficRate = {};
      this.metricsDataService.dataTrafficRate.showCardLayout = true;
    }

    this.tableColumns = [
      {name: gettext('Node'), value: 'spec.hostname'},
      {name: gettext('Cumulative Tx Data'), value: 'metrics.txCumulativeValue', descendingFirst: true},
      {name: gettext('Data Tx Rate'), value: 'metrics.txRate.latestDataPoint', noSort: true},
      {name: gettext('Current Tx Rate'), value: 'metrics.txRate.latestDataPointValue', descendingFirst: true},
      {name: gettext('Cumulative Rx Date'), value: 'metrics.rxCumulativeValue', descendingFirst: true},
      {name: gettext('Data Rx Rate'), value: 'metrics.rxRate.latestDataPoint', noSort: true},
      {name: gettext('Current Rx Rate'), value: 'metrics.txRate.latestDataPointValue', descendingFirst: true}
    ];

    function addMetricPromises(key) {

      var nodeObj = !_.isUndefined(key) ? that.nodes[key] : that.all;
      var metricPromises = [];
      var filter = key ? that.metricsModel.makeNodeNameFilter(nodeObj.spec.metricsNodeName) : that.metricsModel.makeNodeNameFilter('*');
      // Rx Cumulative
      metricPromises.push(that.metricsModel.getMetrics('network_rx_cumulative', filter));

      // Tx Cumulative
      metricPromises.push(that.metricsModel.getMetrics('network_tx_cumulative', filter));

      // Rx Rate
      metricPromises.push(that.metricsModel.getMetrics('network_rx_rate_gauge', filter));

      // Tx Rate
      metricPromises.push(that.metricsModel.getMetrics('network_tx_rate_gauge', filter));

      return $q.all(metricPromises)
        .then(function (metrics) {
          nodeObj.metrics = {};
          nodeObj.metrics.rxCumulative = utilsService.bytesToHumanSize(metrics[0].latestDataPoint);
          nodeObj.metrics.rxCumulativeValue = metrics[0].latestDataPoint;
          nodeObj.metrics.txCumulative = utilsService.bytesToHumanSize(metrics[1].latestDataPoint);
          nodeObj.metrics.txCumulativeValue = metrics[1].latestDataPoint;

          nodeObj.metrics.rxRate = metrics[2];
          nodeObj.metrics.rxRate.latestDataPointValue = metrics[2].latestDataPoint;
          nodeObj.metrics.rxRate.latestDataPoint = utilsService.bytesToHumanSize(metrics[2].latestDataPoint) + '/s';
          nodeObj.metrics.txRate = metrics[3];
          nodeObj.metrics.txRate.latestDataPointValue = metrics[3].latestDataPoint;
          nodeObj.metrics.txRate.latestDataPoint = utilsService.bytesToHumanSize(metrics[3].latestDataPoint) + '/s';
        }).catch(function () {
          nodeObj.metrics = {};
          nodeObj.metrics.rxCumulative = null;
          nodeObj.metrics.rxCumulativeValue = null;
          nodeObj.metrics.txCumulative = null;
          nodeObj.metrics.txCumulativeValue = null;

          nodeObj.metrics.rxRate = {dataPoints: null, latestDataPointValue: null, latestDataPoint: null};
          nodeObj.metrics.txRate = {dataPoints: null, latestDataPointValue: null, latestDataPoint: null};
        });
    }

    function init() {
      metricsDataService.setSortFilters('data-traffic-rate', that.sortFilters, that.defaultFilter);
      that.nodes = metricsDataService.getNodes(that.guid);
      that.filteredNodes = [].concat(that.nodes);
      return $q.resolve().then(function () {
        // Enrich nodes information

        var allMetricPromises = [];
        _.each(that.nodes, function (node, key) {
          allMetricPromises.push(addMetricPromises(key));
        });

        // Add promises for all
        allMetricPromises.push(addMetricPromises());
        return allMetricPromises;
      });
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.network-traffic-summary', $state, init);

  }

  angular.extend(NetworkTrafficController.prototype, {});

})();
