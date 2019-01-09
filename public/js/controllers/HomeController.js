angular.module('BlocksApp').controller('HomeController', function($rootScope, $scope, $http, $timeout, $interval) {
    $scope.$on('$viewContentLoaded', function() {
      // initialize core components
      App.initAjax();
    });

    var URL = '/data';

    $scope.reloadBlocks = function() {
      $scope.blockLoading = true;
      $http({
        method: 'POST',
        url: URL,
        data: {
          "action": "latest_blocks"
        }
      }).success(function(data) {
        $scope.latest_blocks = data.blocks;
        $scope.blockLoading = false;
      });
    }
    $scope.reloadTransactions = function() {
      $scope.txLoading = true;
      $http({
        method: 'POST',
        url: URL,
        data: {
          "action": "latest_txs"
        }
      }).success(function(data) {
        $scope.latest_txs = data.txs;
        $scope.txLoading = false;
      });
    }
    $scope.reloadBlocks();
    $scope.reloadTransactions();
    $scope.txLoading = false;
    $scope.blockLoading = false;
    $scope.settings = $rootScope.setup;
    $scope.timer = $interval(function() {
      $scope.reloadBlocks();
      $scope.reloadTransactions();
    }, 3000);

    $scope.$on('$destroy', function() {
      $interval.cancel($scope.timer);
    });
  })
  .directive('simpleSummaryStats', function($http, $interval) {
    return {
      restrict: 'E',
      templateUrl: '/views/simple-summary-stats.html',
      scope: true,
      link: function(scope, elem, attrs) {
        scope.stats = {};
        var statsURL = "/web3relay";
        scope.reloadInfo = function() {
          $http.post(statsURL, {
              "action": "hashrate"
            })
            .then(function(res) {
              scope.stats.hashrate = res.data.hashrate;
              scope.stats.difficulty = res.data.difficulty;
              scope.stats.blockHeight = res.data.blockHeight;
              scope.stats.blockTime = res.data.blockTime;
            });
        }
        scope.reloadInfo();
        scope.infoTimer = $interval(function() {
          scope.reloadInfo();
        }, 3000);
        scope.$on('$destroy', function() {
          $interval.cancel(scope.infoTimer);
        })
      }
    }
  })
  .directive('superNodes', function($http) {
    return {
      restrict: 'E',
      templateUrl: '/views/super-nodes.html',
      scope: true,
      link: function(scope, elem, attrs) {

        scope.data = {};
        (function() {
          var table = $("#table_superNodes").DataTable({
            processing: true,
            serverSide: true,
            paging: false,
            "ordering": false,
            searching: false,
            stateSave: true,
            "scrollX": true,
            "pagingType": $("html")[0].offsetWidth > 550 ? "full_numbers" : "full",
            stateSaveCallback: function(settings, data) {
              sessionStorage.setItem('superNodes_' + settings.sInstance, JSON.stringify(data))
            },
            stateLoadCallback: function(settings) {
              return JSON.parse(sessionStorage.getItem('superNodes_' + settings.sInstance));
            },
            ajax: function(data, callback, settings) {

              $http.post("/superNode").then(function(list) {
                // save data
                data.count = list.data.length;
                scope.data.data = [...list.data.data];
                scope.data.recordsTotal = list.data.data.length;
                scope.data.recordsFiltered = list.data.data.length;
                callback(scope.data);
              });
            },
            "lengthMenu": [
              [10, 20, 50, 100],
              [10, 20, 50, 100] // change per page values here
            ],
            "pageLength": 10,
            "language": {
              "lengthMenu": "",
              "zeroRecords": "",
              "infoEmpty": "",
              "infoFiltered": ""
            },
            "columnDefs": [{
              "orderable": false,
              "targets": [0]
            }, {
              "render": function(data, type, row) {
                return '<a href="/addr/' + row + '">' + row + '</a>'
              },
              "targets": [0]
            }, ]
          });
        }());
      }
    }
  })
  .directive('siteNotes', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/site-notes.html'
    }
  })
  //OLD CODE DONT USE
  .directive('summaryStats', function($http) {
    return {
      restrict: 'E',
      templateUrl: '/views/summary-stats.html',
      scope: true,
      link: function(scope, elem, attrs) {
        scope.stats = {};

        var etcEthURL = "/stats";
        var etcPriceURL = "https://api.coinmarketcap.com/v1/ticker/ethereum-classic/";
        var ethPriceURL = "https://api.coinmarketcap.com/v1/ticker/ethereum/"
        scope.stats.ethDiff = 1;
        scope.stats.ethHashrate = 1;
        scope.stats.usdEth = 1;
        $http.post(etcEthURL, {
            "action": "etceth"
          })
          .then(function(res) {
            scope.stats.etcHashrate = res.data.etcHashrate;
            scope.stats.ethHashrate = res.data.ethHashrate;
            scope.stats.etcEthHash = res.data.etcEthHash;
            scope.stats.ethDiff = res.data.ethDiff;
            scope.stats.etcDiff = res.data.etcDiff;
            scope.stats.etcEthDiff = res.data.etcEthDiff;
          });
        $http.get(etcPriceURL)
          .then(function(res) {
            scope.stats.usdEtc = parseFloat(res.data[0]["price_usd"]);
            scope.stats.usdEtcEth = parseInt(100 * scope.stats.usdEtc / scope.stats.usdEth);
          });
        $http.get(ethPriceURL)
          .then(function(res) {
            scope.stats.usdEth = parseFloat(res.data[0]["price_usd"]);
            scope.stats.usdEtcEth = parseInt(100 * scope.stats.usdEtc / scope.stats.usdEth);
            scope.stats.ethChange = parseFloat(res.data.change);
          });

      }
    }
  });