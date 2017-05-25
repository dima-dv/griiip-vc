// $scope, $element, $attrs, $injector, $sce, $timeout, $http, $ionicPopup, and $ionicPopover services are available

// handle smart autorefresh

var eventPrefix = "app.mdl.GriiipG1Data.svc.";
var autorefreshConfig = [
  { interval: 1, event: "GetPropertyValues" }
];

var autoPulse = 0;

$scope.autoRefreshHandler = function() {
  autorefreshConfig.forEach(function(item) {
    if((autoPulse % item.interval) == 0) {
      $rootScope.$broadcast(eventPrefix + item.event);
    }
  });
  autoPulse++;
}

$scope.setAutorefreshHandler =  function() {
  if($scope.AutorefreshHandlerPromise === undefined) {
    $scope.AutorefreshHandlerPromise = $interval($scope.autoRefreshHandler, 1000);
  }
}

$scope.resetAutorefreshHandler =  function() {
  if($scope.AutorefreshHandlerPromise !== undefined) {
    $interval.cancel($scope.AutorefreshHandlerPromise);
    delete $scope.AutorefreshHandlerPromise;
  }
}

// clear autorefresh hadler on destroy
$scope.$on("$destroy", $scope.resetAutorefreshHandler);

$scope.setAutorefreshHandler();
              
