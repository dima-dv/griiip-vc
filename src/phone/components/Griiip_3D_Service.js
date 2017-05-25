// $scope, $element, $attrs, $injector, $sce, $timeout, $http, $ionicPopup, and $ionicPopover services are available
var resourcePrefix = "app/resources/Uploaded/";
$scope.app.params.SequenceURL = resourcePrefix + "l-Creo 3D - Combined.pvi";

$scope.resetSequence = function()
{
  angular.element(document.getElementById('model-2')).scope().stop();
  angular.element(document.getElementById('model-2')).scope().reset();
  $scope.app.params.SequenceURL = resourcePrefix + "l-Creo 3D - Combined.pvi";
}

$scope.Airfilter = function() 
{
  $scope.resetSequence();
  $scope.app.params.SequenceURL = resourcePrefix + "l-Creo 3D - AIR_5FFILTER.pvi";
}

$scope.Cooling = function() 
{
  $scope.resetSequence();
  $scope.app.params.SequenceURL = resourcePrefix + "l-Creo 3D - COOLING_5FSYSTEM.pvi";
}

$scope.OilCooling = function() 
{
  $scope.resetSequence();
  $scope.app.params.SequenceURL = resourcePrefix + "l-Creo 3D - OIL_5FCOOLING_5FSYSTEM.pvi";
}

$scope.Suspension = function() 
{
  $scope.resetSequence();
  $scope.app.params.SequenceURL = resourcePrefix + "l-Creo 3D - SUSPENSION_5FSYSTEM.pvi";
}


// handle smart autorefresh

var eventPrefix = "app.mdl.GriiipG1Data.svc.";
var autorefreshConfig = [
//  { interval: 10, event: "TrackLocationImageService" },
//  { interval: 10, event: "OverHeatingService" },
  { interval: 2, event: "GetPropertyValues" }
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
    $scope.AutorefreshHandlerPromise = $interval($scope.autoRefreshHandler, 1000, 0, false);
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
              
