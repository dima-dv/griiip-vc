// $scope, $element, $attrs, $injector, $timeout, $http, $ionicPopup, and $ionicPopover services are available

$scope.getInServiceURL = function() {
  return $scope.app.mdl['PTC.InService.Connector.VuforiaThing'].properties.serverURL.replace("Connector/RestAPI","InService/delivery");
}

$scope.getInServiceNavigateURL = function() {
  return $scope.app.mdl['PTC.InService.Connector.VuforiaThing'].properties.serverURLTWX + "/Thingworx/Runtime/index.html#mashup=PTC.Connector.Mashup.AllSearchTypes";
}

$scope.openItem = function(item) {
  if(item.SRCType == 'PDF') {
    $scope.app.params.selectedSearchTerm = item.TITLE;
    $scope.app.params.showDocument = true;
    $scope.app.params.showTOC = false;
    $scope.app.params.showTarget = false;
    $scope.app.params.showInfo = false;
    $scope.$applyAsync();
    $scope.app.fn.navigate('Home');
//    $timeout(function() {
      $rootScope.$broadcast('app.mdl.PTC.InService.Connector.VuforiaThing.svc.getSearch');
//    }, 3000);
  }
}
