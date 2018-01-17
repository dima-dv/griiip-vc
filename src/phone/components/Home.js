$scope.app.params.vrMode = false;

if(!$scope.app.params.selectedPartId) {
	$scope.app.params.selectedPartId = "";
}

if(!$scope.app.params.selectedSearchTerm) {
	$scope.app.params.selectedSearchTerm = "";
}

if(!$scope.app.params.selectedItemPath) {
	$scope.app.params.selectedItemPath = "";
}

$scope.renderer = tml3dRenderer; //arguments.callee.caller.arguments[11];

const isMobile = true; // (typeof window.cordova !== 'undefined');

$scope.alert = function (txt) {
  alert(txt);
  console.log(txt);
  //debugger;
}

$scope.getWindowSize = function() {
  return {width: window.innerWidth, height: window.innerHeight};
}

$scope.getGlobalEvent = function() {
  return window.event;
}

$scope.createImageURL = function(persistentPartId, imageType, serverURL, authHeader) {
  return (serverURL ? serverURL : $scope.app.mdl['PTC.InService.Connector.VuforiaThing'].properties.serverURL) + 
    	"GetPartMediaByPartId?authHeader=" + encodeURIComponent(authHeader ? authHeader : $scope.app.mdl['PTC.InService.Connector.VuforiaThing'].properties.authHeader) + 
    	"&type=" + imageType + 
    	"&ID=" + encodeURIComponent(persistentPartId);
}

const selectedColor = ['255', '255', '0', 1.0];

$scope.setItemProperties = function (nodeId, props) {
  try {
    let callback = function (orgProps) {
      orgProps = orgProps || {};
      //$scope.alert('getAllPropertyValues callback: ' + $scope.stringify(orgProps));
      try {
        for(let prop in props) {
          if(props.hasOwnProperty(prop)) {
            orgProps[prop] = props[prop];
          }
        }
        $scope.renderer.setProperties(nodeId, orgProps);
      } catch (e) {
        $scope.alert('setProperties: ' + e);
      }
    }
    //$scope.renderer.getAllPropertyValues(nodeId, callback);
    callback();
  } catch (e) {
    $scope.alert('getAllPropertyValues: ' + e);
  }
}

$scope.setItemColor = function (nodeId, c) {
  //$scope.renderer.setColor(nodeId, "rgba(255,255,0,0.75);");
  try {
    if ($scope.renderer.GetObject) {
      let obj = $scope.renderer.GetObject(nodeId);
      let wdg = obj.GetWidget();
      wdg.SetColor(c[0]/255, c[1]/255, c[2]/255, c[3]);
    } else {
      $scope.renderer.setColor(nodeId, `rgba(${c[0]},${c[1]},${c[2]},${c[3]});`);
    }
    $scope.setItemProperties(nodeId, {opacity: c[3]});
  } catch (e) {
    alert('setItemColor: ' + e);
  }
}

$scope.selectRendererObj = function(nodeId) {
  /*
  $scope.setItemColor(nodeId,selectedColor);

  if(isMobile) {
  	$scope.setItemProperties(nodeId, {shader: "Default", hidden: false});
  }
  */
  //$scope.renderer.setProperties(nodeId, {"hidden": false});
  $scope.renderer.setProperties(nodeId, {shader: "demo_highlight_on"});
}

$scope.unsetItemColor = function(nodeId) {
  try {
    $scope.setItemProperties(nodeId, {opacity: -1.0});
    if ($scope.renderer.GetObject) {
      let obj = $scope.renderer.GetObject(nodeId);
      let wdg = obj.GetWidget();
      wdg.UnsetColor();
    } else {
      $scope.renderer.setColor(nodeId, null);
    }  
  } catch (e) {
    alert('unsetItemColor: ' + $scope.stringify(e));
  }
}

$scope.unselectRendererObj = function(nodeId) {
  /*
  $scope.unsetItemColor(nodeId);
  var obj = null;
  if(isMobile) {
	  $scope.setItemProperties(nodeId, {shader: "", hidden: -1});
    //$scope.renderer.setProperties(nodeId, {});
  } else {
    //obj = $scope.renderer.GetObject(nodeId);
    //obj.GetWidget().UnsetVisibility(); delete obj.properties;
  }
  */
  $scope.renderer.setProperties(nodeId, {shader: "demo_highlight_off", occlude: -1.0});
}
  	  
if(!$scope.app.params.partsListPath) {
  $scope.app.params.partsListPath="";
} 

$scope.tocUp = function () {
  var lastSlash = $scope.app.params.partsListIdPath.lastIndexOf("/");
  if(lastSlash > 1) {
    $scope.app.params.partsListIdPath = $scope.app.params.partsListIdPath.substr(0, lastSlash);
  	lastSlash = $scope.app.params.partsListPath.lastIndexOf("/");
    $scope.app.params.partsListPath = $scope.app.params.partsListPath.substr(0, lastSlash);
  	lastSlash = $scope.app.params.partsListIdPath.lastIndexOf("/");
    $scope.app.params.partsListId = $scope.app.params.partsListIdPath.substr(lastSlash+1);
  }
}

$scope.tocDown = function (index) {
  if($scope.app.mdl['PTC.InService.Connector.VuforiaThing'].svc.getPartsListPartInfoAggregate.data && 
     (index < $scope.app.mdl['PTC.InService.Connector.VuforiaThing'].svc.getPartsListPartInfoAggregate.data.length) && 
     $scope.app.mdl['PTC.InService.Connector.VuforiaThing'].svc.getPartsListPartInfoAggregate.data[index].hasAssociatedPartsLists) {
    $scope.app.params.partsListPath += "/" +  $scope.app.mdl['PTC.InService.Connector.VuforiaThing'].svc.getPartsListPartInfoAggregate.data[index].itemNumber;
  	$scope.app.params.partsListIdPath += "/" + $scope.app.mdl['PTC.InService.Connector.VuforiaThing'].svc.getPartsListPartInfoAggregate.data[index].associatedPartsList;
    $scope.app.params.partsListId = $scope.app.mdl['PTC.InService.Connector.VuforiaThing'].svc.getPartsListPartInfoAggregate.data[index].associatedPartsList;
  }
}

$scope.text2key = function (text) {
  return text.replace(/\.(?:asm|prt)/i,"");
}

$scope.key2PartsListId = function (key) {
  return 'PL_' + key;
}

$scope.key2PartId = function (key) {
  return 'PA_' + key;
}

$scope.getPartsListIdPath = function (node) {
  let res = "";
  while(node) {
    res = '/' + $scope.key2PartsListId(node.key) + res;
    node = node.parent;
  }
  return res;
}

$scope.setToc = function (node) {
  if($scope.app.params.partsListPath !== node.path) {
    $scope.app.params.partsListPath = node.path;
    $scope.app.params.partsListIdPath = $scope.getPartsListIdPath(node);
    $scope.app.params.partsListId = $scope.key2PartsListId(node.key);
  }
}

$scope.stringify = function(e) {
  try {
    var seen = [];
    if("undefined"==typeof e) {
        return "undefined";
    } else if("string"==typeof e) {
        return e;
    } else if("undefined" != typeof JSON.stringify) {
        return JSON.stringify(e, function(key, val) {
           if (typeof val == "object" && val != null) {
                if (seen.indexOf(val) >= 0) {
                    return "((cycle))";
                } else if (key.toLowerCase().includes("scope")) {
                    return "(($scope)";
                }
                seen.push(val);
            }
            return val;
        });      
    } else if("undefined" != typeof window.JSON.stringify) {
        return window.JSON.stringify(e);
    } else {
        return e.toString();
    }
  } catch (ex) {
    return ex.toString();
  }
  return "error";
}

$scope.parse = function(e) {
  try {
    var seen = [];
    if("undefined"==typeof e) {
        return "undefined";
    } else if("string"!=typeof e) {
        return e;
    } else if("undefined" != typeof JSON.parse) {
        return JSON.parse(e);      
    } else if("undefined" != typeof window.JSON.parse) {
        return window.JSON.parse(e);
    }
  } catch (ex) {
    return ex.toString();
  }
  return "error";
}

$scope.$on('trackingacquired', function (evt, arg) {
//  alert('evt='+$scope.stringify(evt)+';arg='+$scope.stringify(arg));
  $scope.app.params.vumark=arg;
});

$scope.$watch("app.params.vumark", function (newValue, oldValue, $scope) {
  if(newValue && newValue !== oldValue) {
    $http.get("/ExperienceService/content/reps/" + newValue.replace(':','_') + "_config.json").success(function (config) {
      if(config.params) {
        let params = config.params;
        for(let key in params) {
          if (params.hasOwnProperty(key)) {
            $scope.app.params[key] = params[key];
          }
        }
      }

      if(config.tempPath2Path) {
        tempPath2Path = config.tempPath2Path;
      } else {
        tempPath2Path = {};
      }

      if(config.proc2sequence) {
        proc2sequence = config.proc2sequence;
      } else {
        proc2sequence = {};
      }

      if(config.widgets) {
        let widgets = config.widgets;
        for(let widget in widgets) {
          if (widgets.hasOwnProperty(widget)) {
            let widget_obj = widgets[widget];
            for(let property in widget_obj) {
              if (widget_obj.hasOwnProperty(property)) {
                $scope.setWidgetProp(widget, property, widget_obj[property]);
              }
            }
          }
        }
      }
    });
  }
});

var widgets = $element.find("twx-widget");
var i;
var widget;
for(i=0; i < widgets.length; i++) {
  widget = widgets[i];
  if(widget.attributes["widget-id"].value=="targetMark") {
    $scope.targetWidget = widget;
  /*
  } else if(widget.attributes["widget-id"].value=="activateButton") {
    widget.style.alignContent="flex-end";
    var content = angular.element(widget).find("twx-widget-content")[0];
    // content.style.alignContent="flex-end";
  */
  }
}

/*
$scope.$on('resize', function(evt) { enabletrackingevents="true"
  alert("resize" + evt);
})

$scope.$on('resizeMsg', function(evt) {
  alert("resize" + evt);
})
*/

function myRegisterResize($scope) {
	angular.element(window).bind("resize", function(evt) {
      $scope.$applyAsync("app.params.centerLeft = getWindowSize().width/2");
      $scope.$applyAsync("app.params.centerTop = getWindowSize().height/2");
      //$scope.$digest();
    })
}

myRegisterResize.$inject = ['$scope'];
$injector.invoke(myRegisterResize,window,{$scope: $scope});

//debugger;

var trackerElement = angular.element(document.getElementById("tracker1"));
if(trackerElement.attr("enabletrackingevents") != "true")
{
  trackerElement.attr("enabletrackingevents", "true");
  //$injector.get("$compile").invoke(trackerElement)();
}

/*
$scope.$watchGroup(["window.innerWidth","window.innerHeight"], function (newValues, oldValues, $scope) {
  $scope.app.params.centerLeft = newValues[0]/2;
  $scope.app.params.centerTop = newValues[1]/2;
});
*/

$scope.app.params.centerLeft = $scope.getWindowSize().width/2;
$scope.app.params.centerTop = $scope.getWindowSize().height/2;

//$scope.$watchGroup(["app.params.centerLeft","app.params.centerTop","app.params.showTarget"], function (newValues, oldValues, $scope) {
$scope.$watchGroup(["targetWidget.offsetParent.clientHeight","targetWidget.offsetParent.clientWidth","app.params.showTarget"], function (newValues, oldValues, $scope) {
//  $scope.targetWidget.style.left = newValues[0] + "px";
//  $scope.targetWidget.style.top = newValues[1] + "px";
  if($scope.app.fn.isTrue(newValues[2])) {
    var widget = $scope.targetWidget; 
    var image = widget.getElementsByTagName("twx-widget-content")[0].getElementsByTagName("img")[0];
//    image.style.top = widget.offsetParent.clientHeight/2 - 25 + "px";
//    image.style.left = widget.offsetParent.clientWidth/2 - 25 + "px";
    image.style.top = $scope.app.params.centerTop /* - 25*/ + "px";
    image.style.left = $scope.app.params.centerLeft /* - 25*/ + "px";
  } else {
	$scope.resetSelectedItem();
  }
});

function vectorScalarProduct(v1,v2) {
  return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}

function vectorLength(v) {
  return Math.sqrt(vectorScalarProduct(v,v));
}

function vectorResize(v,n) {
  return [v[0] * n, v[1] * n, v[2] * n];
}

function vectorNormalize(v) {
  return vectorResize(v, 1/vectorLength(v));
}

function vectorSum(v1,v2) {
  return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}

function createMatrix(x,y,z,cx,cy,cz) {
}

/*
var trackingAccumulator;

$scope.$on("tracking", function(evt, args) {
  var str;
  try {
    if(trackingAccumulator) {
      trackingAccumulator.position = vectorSum(vectorResize(trackingAccumulator.position, 0.80), vectorResize(args.position, 0.20));
      trackingAccumulator.gaze = vectorSum(vectorResize(trackingAccumulator.gaze, 0.80), vectorResize(args.gaze, 0.20));
      trackingAccumulator.up = vectorSum(vectorResize(trackingAccumulator.up, 0.80), vectorResize(args.up, 0.20));
	  str = $scope.stringify(trackingAccumulator);
    } else {
	  str = $scope.stringify(args);
      trackingAccumulator = $scope.parse(str);
    }
  } catch (e) { }
  $scope.$applyAsync("app.params.testValueTmp = '" + str + "'");
});

$interval(function () {
  trackingAccumulator = null;
  $scope.$applyAsync("app.params.testValue = '" + $scope.app.params.testValueTmp + "'");
}, 500);

*/

/*
$scope.$on$scope.$on("trackingacquired", function(evt, args) {
  var str = "trackingacquired:";
  try {
  	str = str + " evt: " + $scope.stringify(evt) + " args: " + $scope.stringify(args);
  } catch (e) { }
  $scope.app.params.testValue = str;
})
*/


function getParentItemPath(path) {
  var lastSlash = path.lastIndexOf('/');
  if(lastSlash < 0) {
    return "";
  } else {
    return path.substring(0, lastSlash);
  }
}

$scope.test = function(obj) {
  debugger;
  var args = {targetName:'dt-tarcker-1',position:[5,5,5],gaze:vectorNormalize([-1,-1,-1]),up:[0,0,1]};
  $scope.$emit("tracking", args);
}

// selected modelItem id (not in use)
$scope.app.params.selectedItem = "";

const modelName = "model-2";

var item2id = {};
/*
item2id["/0/0/0"]={part: "PA_BODYASSEMBLY_2017_03_02", term: ""};
item2id["/0/0/0/2"]={part: "PA_SIDEPODS_2017_03_03", term: ""};
item2id["/0/0/0/4"]={part: "PA_0000000233", term: ""};
item2id["/0/0/1"]={part: "PA_1011-09-03-00-000", term: ""};
item2id["/0/0/1/0"]={part: "PA_GP00372", term: ""};
item2id["/0/0/8"]={part: "PA_1011-09-04-00-000", term: ""};
item2id["/0/0/9/8"]={part: "PA_1011-09-02-00-001", term: ""};
item2id["/0/0/13/4"]={part: "PA_1011-01-00-05-000", term: ""};
item2id["/0/0/14/4"]={part: "PA_1011-01-00-06-000", term: ""};
item2id["/0/1/0/0/1"]={part: "PA_GP00256", term: "GP00256"};
item2id["/0/1/1/0/1"]={part: "PA_GP00257", term: ""};
item2id["/0/1/2/0/1"]={part: "PA_GP00256", term: "GP00256"};
item2id["/0/1/3/0/1"]={part: "PA_GP00257", term: ""};
item2id["/0/3/0/0"]={part: "PA_GP00166_A", term: ""};
item2id["/0/5/0"]={part: "PA_FRONT_SUSPENSION", term: "FRONT_SUSPENSION"};
item2id["/0/5/0/0/0/0/0"]={part: "PA_1101-05-01-00-408DEFAULT_AS_MAC", term: ""};
item2id["/0/5/0/0/1/0/0"]={part: "PA_1101-05-01-00-404DEFAULT_AS_MAC", term: ""};
item2id["/0/5/0/0/2/0/0"]={part: "PA_1101-05-01-00-404DEFAU238182779", term: ""};
item2id["/0/5/0/0/3/0/0"]={part: "PA_1101-05-01-00-408DEFAULT_AS_MAC", term: ""};
item2id["/0/5/0/2/0/0/0"]={part: "PA_1101-05-01-05-404DEFAULT_AS_MAC", term: ""};
item2id["/0/5/0/2/1/0/0"]={part: "PA_1101-05-01-05-404DEFAULT_AS_MAC", term: ""};
item2id["/0/6/0"]={part: "PA_AIR_INTAKE", term: ""};
item2id["/0/6/0/2"]={part: "PA_AIR_FILTER", term: "AIR_FILTER"};
item2id["/0/6/1"]={part: "PA_ENGINE_COOLING_SYSTEM", term: "ENGINE_COOLING_SYSTEM"};
item2id["/0/6/2"]={part: "PA_OIL_COOLING_SYSTEM", term: "OIL_COOLING_SYSTEM"};
item2id["/0/9/0/0"]={part: "PA_1011-02-00-00-021", term: ""};
item2id["/0/9/1"]={part: "PA_GP00165", term: ""};
*/
//item2id["/51/1/2"]={part: "PA_1011-08-02-02-000_GP", term: "griiip" /*"mechanical part able to perform a conversion" , partinfo: {name: "Pinion ASM", number: "1011-08-02-02-000"} */};  // Pinion
//item2id["/40/21/116"]={part: "PA_1011-01-01-01-400_GP", term: "" /*"mechanical part able to perform a conversion" , partinfo: {name: "Pinion ASM", number: "1011-08-02-02-000"} */};  // Chassis
//item2id["/50/108/27"]={part: "PA_00257_GP", term: "" /*"mechanical part able to perform a conversion", partinfo: {name: "Tire (rear)", number: "00257"}*/};  // Rear tire right
//item2id["/50/198/27"]={part: "PA_00257_GP", term: "" /*"mechanical part able to perform a conversion", partinfo: {name: "Tire (rear)", number: "00257"}*/};  // Rear tire left
//item2id["/50/107/23"]={part: "PA_00256_GP", term: "" /*"mechanical part able to perform a conversion", partinfo: {name: "Tire (rear)", number: "00257"}*/};  // Front tire right
//item2id["/50/197/23"]={part: "PA_00256_GP", term: "" /*"mechanical part able to perform a conversion", partinfo: {name: "Tire (rear)", number: "00257"}*/};  // Front tire left

$scope.resetSelectedItem = function() {
  $scope.app.params.selectedItem = "";
}

var modelItemsById;
var modelItemsByPath;

var tempPath2Path = {};
var proc2sequence = {};


/*
// float
tempPath2Path["model-2/0/0/0/3"]="model-2/0/0/0";
tempPath2Path["model-2/0/0/1/1"]="model-2/0/0/1";
tempPath2Path["model-2/0/0/1/2"]="model-2/0/0/1";
tempPath2Path["model-2/0/0/8/0"]="model-2/0/0/8";
tempPath2Path["model-2/0/0/8/1"]="model-2/0/0/8";
tempPath2Path["model-2/0/0/8/2"]="model-2/0/0/8";
tempPath2Path["model-2/0/0/8/3"]="model-2/0/0/8";
tempPath2Path["model-2/0/6/0/0"]="model-2/0/6/0";

// map
tempPath2Path["model-2/0/3/0/0/0"]="model-2/0/3/0/0";
*/

$scope.selectItemByPath = function(path) {
  if(tempPath2Path.hasOwnProperty(path)) {
    path = tempPath2Path[path];
  }
  
  if(modelItemsByPath.hasOwnProperty(path)) {
    $scope.app.params.selectedItem = modelItemsByPath[path].id;
  }
  else
  {
    $scope.resetSelectedItem();
  }
  $scope.app.params.selectedItemPath = path;
}

$scope.$on('userpick', function(event, targetName, targetType, evtData) {
  var evt = $scope.parse(evtData);
  
  //alert("Fired userpick(" + evtData + ")");

  if(evt && evt.occurrence) {
	  $scope.selectItemByPath(modelName + evt.occurrence);    
  } else {
	  $scope.selectItemByPath("");
  }
    
  //$scope.shaded = 'model-1-' + evt.occurrence;
  //vuforia.setProperties($scope.shaded, { shader:"nolighting",hidden:false,opacity:0.9 });
  //$scope.$applyAsync();
});



var thingMarkMatrix;
$scope.$watch("app.params.testValue", function (newValue, oldValue, $scope) {
  var tracking = $scope.parse(newValue);
  if(typeof tracking == "undefined" || tracking == "")  {
    return;
  }
  
  if(!$scope.app.fn.isTrue($scope.app.params.showTarget)) {
    return;
  }
  
  /*
  	!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    
    WORKING IN CAMERA POSITION AXES
    
    y
    ^ z
    |/
    -->x
    
    MODEL 
     y
    /
    -->x
    |
    z
    
    GAZE
     z
    /
    -->x
    |
    y
        
    
    
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
   */
    
  var viewVector = vec4.fromValues(tracking.gaze[0], -tracking.gaze[1], tracking.gaze[2], 0);
  //viewVector[1] = -viewVector[1];
  vec4.transformMat4(viewVector, viewVector, thingMarkMatrix);
  vec4.normalize(viewVector, viewVector);
  
  var eyePos = vec4.fromValues(tracking.position[0], tracking.position[1], tracking.position[2], 1);
  vec4.transformMat4(eyePos, eyePos, thingMarkMatrix);
  
  var treshold;
  {
    var distance = vec4.distance(vec4.fromValues(0,0,0,1), eyePos); //target pos 0,0,0
    var tresholdVector = vec4.fromValues(0.15 /* sensitivity */, 0, distance, 0);
    vec4.normalize(tresholdVector,tresholdVector);
    
  	treshold = vec4.dot(vec4.fromValues(0,0,1,0),tresholdVector);
  }
  
  var targetPos = vec4.fromValues(0,0,0,1); // = [targetItem['x'],-targetItem['z'],targetItem['y']];
  var targetVector = vec4.create(); // = [targetPos[0]-tracking.position[0],tracking.position[1]-targetPos[1],targetPos[2]-tracking.position[2]];
  var widgets = $scope.app.view['Home'].wdg;
  
  var targetItem; // = $scope.app.view['Home'].wdg['modelItem-1'];
  
  var vecProduct; // = vectorScalarProduct(targetVector, viewVector);
  var candidateId="";
  var candidateDiff=treshold;

  for(key in modelItemsById) {
    if (modelItemsById.hasOwnProperty(key) && modelItemsById[key].isTarget) {
      targetItem = modelItemsById[key];
      targetPos = mat4.getTranslation(targetPos, targetItem.matrix);
      targetVector = vec4.subtract(targetVector, targetPos, eyePos);
      //[targetPos[0]-tracking.position[0],targetPos[1]-tracking.position[1],targetPos[2]-tracking.position[2]];
	  targetVector = vec4.normalize(targetVector,targetVector);
      vecProduct = vec4.dot(targetVector, viewVector);

      if(vecProduct > candidateDiff) {
        candidateId = key;
        candidateDiff = vecProduct;
      }
    }
  }
    
  $scope.app.params.selectedItem = candidateId;
  
  if($scope.app.fn.isTrue($scope.app.params.showPopup)) {
    $scope.$applyAsync("app.view['Home'].wdg['label-1'].text='" + eyePos[0] + "'");  
    $scope.$applyAsync("app.view['Home'].wdg['label-2'].text='" + eyePos[1] + "'");  
    $scope.$applyAsync("app.view['Home'].wdg['label-3'].text='" + eyePos[2] + "'");  
    $scope.$applyAsync("app.view['Home'].wdg['label-4'].text='" + viewVector[0] + "'");  
    $scope.$applyAsync("app.view['Home'].wdg['label-5'].text='" + viewVector[1] + "'");  
    $scope.$applyAsync("app.view['Home'].wdg['label-6'].text='" + viewVector[2] + "'");  

    targetItem = widgets["3DImage-1"];
    
    targetPos = vec4.set(targetPos, targetItem['x'],targetItem['y'],targetItem['z'], 1);
    viewVector = vec4.scale(viewVector, viewVector, (targetPos[1]-eyePos[1])/viewVector[1])
	targetPos = vec4.add(targetPos, eyePos, viewVector);
    
    targetItem.x = targetPos[0];
    targetItem.z = targetPos[2];
    
    $scope.$applyAsync("app.view['Home'].wdg['label-9'].text='" + targetPos[0] + "'");  
    $scope.$applyAsync("app.view['Home'].wdg['label-10'].text='" + targetPos[1] + "'");  
    $scope.$applyAsync("app.view['Home'].wdg['label-11'].text='" + targetPos[2] + "'");  

    $scope.$applyAsync("app.view['Home'].wdg['label-12'].text='" + tracking.up[0] + "'");  
    $scope.$applyAsync("app.view['Home'].wdg['label-13'].text='" + tracking.up[1] + "'");  
    $scope.$applyAsync("app.view['Home'].wdg['label-14'].text='" + tracking.up[2] + "'");  
    $scope.$applyAsync("app.view['Home'].wdg['label-7'].text='" + (1 - candidateDiff) + "'");  
    $scope.$applyAsync("app.view['Home'].wdg['label-8'].text='" + (1 - treshold) + "'");  
    
  }
});
                   
$scope.$watch("app.params.selectedItem", function (newValue, oldValue, $scope) {
  var targetItem;
  if(newValue == oldValue) {
    return;
  }
  
  if(oldValue) {
    targetItem = $scope.app.view['Home'].wdg[oldValue];
    targetItem.color = "";
    if(!$scope.app.fn.isTrue($scope.app.params.vrMode)) {
      targetItem.visible = false;
    }
  }
    
  if(newValue) {
    targetItem = $scope.app.view['Home'].wdg[newValue];
  	if(!$scope.app.fn.isTrue($scope.app.params.vrMode)) {
      targetItem.visible = true;
    }
    targetItem.color = "rgba(255,255,0,1);";
    
    if(item2id.hasOwnProperty(targetItem.idpath)) {
      $scope.app.params.selectedPartId = item2id[targetItem.idpath].part;
      $scope.app.params.selectedSearchTerm = item2id[targetItem.idpath].term;
    }
  }
});

$scope.$watch("app.params.selectedItemPath", function (newValue, oldValue, $scope) {
  var targetPath;
  var idpath;
  if(newValue === oldValue) {
    return;
  }
  
  if(oldValue) {
    idpath = oldValue.substr(modelName.length);
    targetPath = modelName + "-" + idpath;
    $scope.unselectRendererObj(targetPath);
  }
    
  if(newValue) {
    idpath = newValue.substr(modelName.length);
    targetPath = modelName + "-" + idpath;
    $scope.selectRendererObj(targetPath);

    let node;
    if($scope.toc && (node = $scope.toc.getNodeByPath(idpath))) {
      $scope.app.params.selectedPartId = $scope.key2PartId(node.key);
      $scope.app.params.selectedSearchTerm = node.key;
      if(node.parent) {
        $scope.setToc(node.parent);
      }
      $scope.$applyAsync();
    } else if(item2id.hasOwnProperty(idpath)) {
      $scope.app.params.selectedPartId = item2id[idpath].part;
      $scope.app.params.selectedSearchTerm = item2id[idpath].term;
      $scope.$applyAsync();
    }
  } else {
    $scope.app.params.selectedPartId = "";
    $scope.app.params.selectedSearchTerm = "";
  }  
});

//$scope.$watch("app.params.selectedPartId", function(newValue, oldValue) {
$scope.$watchGroup(["app.params.selectedPartId","app.params.showInfo"], function (newValue, oldValue, $scope) {
  if($scope.app.fn.isTrue(newValue[1]) && (newValue[0])) {
    $rootScope.$broadcast('app.mdl.PTC.InService.Connector.VuforiaThing.svc.getPart');
  }
});

//$scope.$watch("app.params.partsListId", function(newValue, oldValue) {
$scope.$watchGroup(["app.params.partsListId","app.params.showTOC"], function (newValue, oldValue, $scope) {
  if($scope.app.fn.isTrue(newValue[1]) && (newValue[0])) {
    $rootScope.$broadcast('app.mdl.PTC.InService.Connector.VuforiaThing.svc.getPartsListPartInfoAggregate');
  }
});

$scope.$watch("app.params.vrMode", function(newValue, oldValue) {
  //$scope.app.view['Home'].wdg["model-2"].opacity = $scope.app.fn.isTrue(newValue) ? 0.75 : 0.1;
  //$scope.app.view['Home'].wdg["model-2"].visible = $scope.app.fn.isTrue(newValue);
  $scope.view.wdg['model-2']['occlude'] = !$scope.app.fn.isTrue(newValue);
});

/*
$scope.$watch("app.params.showPopup", function(newValue, oldValue) {
  if((newValue != oldValue) && (newValue !== undefined)) {
	$scope.app.view['Home'].wdg["3DImage-1"].opacity = $scope.app.fn.isTrue(newValue) ? 1 : 0;
  }
});
*/

function getElementById(element, id) {
  if(element.getElementById) {
    var el = element.getElementById(id);
    return el;
  } else if(element.querySelector) {
    return element.querySelector("#"+id);
  } else {
    alert("can't support getElementById");
  }
}

$scope.$watch("app.mdl['PTC.InService.Connector.VuforiaThing'].svc.getMedia.data.current.result", function(newValue, oldValue) {
  if(newValue)
  {
    $scope.app.params.partDoc = $sce.trustAsHtml(newValue);
    $timeout(function() {
      var area = angular.element(getElementById(document, "docArea"));
      var scripts = area.find("script");
      angular.forEach(scripts, function(el) {
        if(typeof el.attributes["src"] == "undefined") {
          eval(el.text);
        }
      });
    });
  }
});

$scope.$watch("app.mdl['PTC.InService.Connector.VuforiaThing'].svc.getServiceInformation.data.current.result", function(newValue, oldValue) {
  if(newValue !== oldValue) {
    $scope.app.params.procOutline = newValue;
  }
});

function setTargetHandler() {
  if($scope.targetHandlerPromise === undefined) {
    $scope.targetHandlerPromise = $interval(function () {
      if(!$scope.app.fn.isTrue($scope.app.params.showTarget)) {
        return;
      }

      if (typeof($scope.renderer.userPick) === "function") {
        $scope.renderer.userPick({x: $scope.app.params.centerLeft, y: $scope.app.params.centerTop});
      }
    }, 400, 0, false);
  }
}

function resetTargetHandler() {
  if($scope.targetHandlerPromise !== undefined) {
    $interval.cancel($scope.targetHandlerPromise);
    delete $scope.targetHandlerPromise;
  }
}

// start/stop selector
$scope.$watch("app.params.showTarget", function(newValue, oldValue) {
  if(newValue !== oldValue) {
    if($scope.app.fn.isTrue(newValue)) {
      // set cross handler
      setTargetHandler();
    } else {
      resetTargetHandler();
    }
  }
});

// clear target hadler on destroy
$scope.$on("$destroy", resetTargetHandler);
              

// binding compatibility code

// app.mdl['PTC.InService.Connector.VuforiaThing'].svc['getPartsListPartInfoAggregate'].data.current['partID'] => app.params.selectedPartId
/*
$scope.$watch("app.mdl['PTC.InService.Connector.VuforiaThing'].svc['getPartsListPartInfoAggregate'].data.current['partID']", function(newValue, oldValue) {
  if((newValue !== oldValue) && newValue) {
    $scope.app.params.selectedPartId = newValue;
  }
});
*/
              
// app.mdl['PTC.InService.Connector.VuforiaThing'].svc['getPartsListPartInfoAggregate'].data.current['partNumber'] => app.params.selectedSearchTerm
/*
$scope.$watch("app.mdl['PTC.InService.Connector.VuforiaThing'].svc['getPartsListPartInfoAggregate'].data.current['partNumber']", function(newValue, oldValue) {
  if((newValue !== oldValue) && newValue) {
    $scope.app.params.selectedSearchTerm = newValue;
  }
});
*/

// app.params.showTarget || app.params.showTOC => app.params.showActionButtons
$scope.$watchGroup(["app.params.showDocument","app.params.showInfo","app.params.selectedItemPath","app.params.selectedPartId","app.params.selectedSearchTerm"], function (newValues, oldValues, $scope) {
  $scope.app.params.showActionButtons = $scope.app.fn.isTrue(newValues[0]) || $scope.app.fn.isTrue(newValues[1]) || (!!newValues[2]) || (!!newValues[3]) || (!!newValues[4]);
});

// end of binding compatibility code

$scope.loadScript = function(src,callback){
    var script = document.createElement("script");
    script.type = "text/javascript";
    if(callback)script.onload=callback;
    document.getElementsByTagName("head")[0].appendChild(script);
    script.src = src;
}

function breakpoint() {
//  debugger;
}

//$httpProvider.defaults.useXDomain = true;
$scope.$http = $http;

$scope.loadScript("app/resources/Uploaded/underscore.js", breakpoint);
$scope.loadScript("app/resources/Uploaded/cpcViewer.js", breakpoint);
$scope.loadScript("app/resources/Uploaded/cpc.js", function() {
  var cpcvar = cpc;
  $scope.cpc = function(url, canvas) {
    var el = getElementById(document, canvas);
    //el.style["background-color"] = "red";
    cpcvar(url, canvas, $scope);
  };
  
  cpc = $scope.cpc;
});

function initTOC(tree, container, textFilter) {
  container.tree = tree;
  container.byPath = {};
  container.byKey = {};
  if(textFilter) {
    container.keyGenerator = textFilter;
  }

  let combine = function () {
    let functions = Array.from(arguments);
    return (function() {
      let that = this;
      let args = arguments;
      functions.forEach(function(f) {
        if(typeof f === 'function') {
          f.apply(that, args);
        }
      });
    });
  };

  let TreeIterator = function (pre, post) {
    this.pre = pre;
    this.post = post;
  };

  TreeIterator.prototype.iterate = function(node) {
    if(this.pre) {
      this.pre(node);
    }
    if(node.sub && node.sub.length > 0) {
      node.sub.forEach(this.iterate, this);
    }
    if(this.post) {
      this.post(node);
    }
  };

  let preParent = function(node) {
    if(this.parent) {
      node.parent = this.parent;
    }
    this.parent = node;
  }

  let postParent = function(node) {
    this.parent = node.parent;
  }

  let setPath = function(node) {
    let parentPath;
    if(node.parent && node.parent.path) {
      parentPath = node.parent.path;
    }

    if(parentPath && (node.order || node.order === 0)) {
      node.path = parentPath + '/' + node.order;
    } else if(parentPath) {
      node.path = parentPath;
    } else if(node.order || node.order === 0) {
      node.path = '/' + node.order;
    } else {
      node.path = "";
    }
  };

  let setKey = function(node) {
    if(textFilter) {
      node.key = textFilter(node.text);
    } else {
      node.key = node.text;
    }
  }

  let registerByKey = function(node) {
    if(!container.byKey[node.key]) {
      container.byKey[node.key] = [];
    }
    container.byKey[node.key].push(node);
  }

  let registerByPath = function(node) {
    container.byPath[node.path] = node;
  }

  let iter = new TreeIterator(combine(preParent, setPath, setKey, registerByKey, registerByPath), postParent);
  iter.iterate(container.tree);
}

class TOC {
  constructor(tree, keyGenerator) {
    initTOC(tree, this, keyGenerator);
  }

  getNodeByPath(path) {
    return this.byPath[path];
  }

  getNodesByKey(key) {
    return this.byKey[key];
  }

  getNodesByText(text) {
    let key = this.keyGenerator ? this.keyGenerator(text) : text;
    return getNodesByKey(key);
  }
}

$scope.$watch("app.params.pvzName", function (newValue, oldValue, $scope) {
  if(newValue && newValue !== oldValue) {
    $http.get("/ExperienceService/content/reps/" + newValue + "_tree.json").success(function (tree) {
      $scope.toc = new TOC(tree[0], $scope.text2key);
    });
  }
});

// simulate InService data from model tree
const dataShape = {
  "fieldDefinitions": {
    "associatedPartsList": {
      "name": "associatedPartsList",
      "description": "",
      "baseType": "STRING",
      "ordinal": 10,
      "aspects": {}
    },
    "hasAssociatedPartsLists": {
      "name": "hasAssociatedPartsLists",
      "description": "",
      "baseType": "STRING",
      "ordinal": 6,
      "aspects": {}
    },
    "ID": {
      "name": "ID",
      "description": "Parts Line Item ID",
      "baseType": "STRING",
      "ordinal": 7,
      "aspects": {}
    },
    "itemNumber": {
      "name": "itemNumber",
      "description": "",
      "baseType": "STRING",
      "ordinal": 13,
      "aspects": {}
    },
    "lineNumber": {
      "name": "lineNumber",
      "description": "",
      "baseType": "STRING",
      "ordinal": 12,
      "aspects": {}
    },
    "partID": {
      "name": "partID",
      "description": "",
      "baseType": "STRING",
      "ordinal": 9,
      "aspects": {}
    },
    "partNumber": {
      "name": "partNumber", "description": "", "baseType": "STRING", "ordinal": 6, "aspects": {}
    },
    "partsListID": { "name": "partsListID", "description": "", "baseType": "STRING", "ordinal": 8, "aspects": {} },
    "partsListItemName": { "name": "partsListItemName", "description": "", "baseType": "STRING", "ordinal": 5, "aspects": {} },
    "position": { "name": "position", "description": "", "baseType": "STRING", "ordinal": 11, "aspects": {} },
    "quantity": { "name": "quantity", "description": "", "baseType": "STRING", "ordinal": 7, "aspects": {} },
    "serviceable": { "name": "serviceable", "description": "", "baseType": "STRING", "ordinal": 8, "aspects": {} },
    "THUMBNAIL": { "name": "THUMBNAIL", "description": "", "baseType": "STRING", "ordinal": 5, "aspects": {} }
  }
};

$scope.$on(/*"app.mdl.PTC.InService.Connector.VuforiaThing.svc." +*/ "getPartsListPartInfoAggregate.serviceInvokeComplete", function (evt, arg) {
  if(!$scope.app.mdl['PTC.InService.Connector.VuforiaThing'].svc['getPartsListPartInfoAggregate'].data.length > 0) {
    $scope.$emit(/*"app.mdl.PTC.InService.Connector.VuforiaThing.svc." +*/ "getPartsListPartInfoAggregate.serviceFailure");
  }
});
  
$scope.$on(/*"app.mdl.PTC.InService.Connector.VuforiaThing.svc." +*/ "getPartsListPartInfoAggregate.serviceFailure", function (evt, arg) {
  let svcModelData = "app.mdl['PTC.InService.Connector.VuforiaThing'].svc['getPartsListPartInfoAggregate'].data";
  let pl = $scope.toc.getNodeByPath($scope.app.params['partsListPath']);

  let modelData = [];
  pl.sub.forEach((child, idx) => {
    let row = {
      hasAssociatedPartsLists: !!child.sub,
      associatedPartsList: child.sub ? $scope.key2PartsListId(child.key) : "",
      partID: $scope.key2PartId(child.key),
      partNumber: child.key,
      partsListItemName: child.text,
      itemNumber: child.order,
      position: idx + 1
    };
    modelData.push(row);
  });
  modelData.current=null;

  $scope.$eval(svcModelData + '=data', {data: modelData});
});

$scope.$on(/*"app.mdl.PTC.InService.Connector.VuforiaThing.svc." +*/ "getPart.serviceInvokeComplete", function (evt, arg) {
  if(!$scope.app.mdl['PTC.InService.Connector.VuforiaThing'].svc['getPart'].data.length > 0) {
    $scope.$emit(/*"app.mdl.PTC.InService.Connector.VuforiaThing.svc." +*/ "getPart.serviceFailure");
  }
});
  
$scope.$on(/*"app.mdl.PTC.InService.Connector.VuforiaThing.svc." +*/ "getPart.serviceFailure", function (evt, arg) {
  let svcModelData = "app.mdl['PTC.InService.Connector.VuforiaThing'].svc['getPart'].data";
  let item = $scope.toc.getNodeByPath($scope.app.params['selectedItemPath'].substr(modelName.length));

  let modelData = [{
    partName: item.text,
    partNumber: item.key
  }];
  modelData.current=modelData[0];

  $scope.$eval(svcModelData + '=data', {data: modelData});
});

class Procedure {
  constructor(id, outline) {
    this.id = id;
    this.outline = outline;
  }

  getStep(n) {
    return this.outline.steplist["procedure-step"][n];
  }

  getNumberOfSteps() {
    return  this.outline.steplist.length;
  }

  getStepNode(n) {
    return this.getStep(n)["target-node"];
  }

  getStepXloc(n)
  {
    return `#node-id(${this.getStepNode(n)})`;
  }

  renderStep(n) {
    return "";
  }

  renderAll() {
    return "";
  }

  getID() {
    return id;
  }
}

let acquireProcedureOutline = function (id, callback) {
  if(id) {
    /*
    $http.get("/ExperienceService/content/reps/" + id + "_outline.json").success(function (json) {
      let str = JSON.stringify(json);
      callback(str);
    });
    */
    //$scope.app.mdl['PTC.InService.Connector.VuforiaThing'].svc.getServiceInformation.data.current.result = null;
    let unwatch = $scope.$watch("app.mdl['PTC.InService.Connector.VuforiaThing'].svc.getServiceInformation.data.current.result", function(newValue, oldValue) {
      if(newValue !== oldValue) {
        unwatch();
        callback(newValue);
      }
    });
    $rootScope.$broadcast('app.mdl.PTC.InService.Connector.VuforiaThing.svc.getServiceInformation');
  } else {
    $timeout(function () {
      callback("");
    });
  }
};

let acquireProcedureStep = function (id, num, callback) {
  if(id && (typeof num === "number")) {
    /*
    $http.get("/ExperienceService/content/reps/" + id + "_outline.json").success(function (json) {
      let str = JSON.stringify(json);
      callback(str);
    });
    */
    //$scope.app.mdl['PTC.InService.Connector.VuforiaThing'].svc.getServiceInformation_2.data.current.result = null;
    let unwatch = $scope.$watch("app.mdl['PTC.InService.Connector.VuforiaThing'].svc.getServiceInformation_2.data.current.result", function(newValue, oldValue) {
      if(newValue !== oldValue) {
        unwatch();
        callback(newValue);
      }
    });
    $rootScope.$broadcast('app.mdl.PTC.InService.Connector.VuforiaThing.svc.getServiceInformation_2', 
      {"DocLoc": $scope.proc.getStepXloc(num), "StylesheetParams": `target-node=${$scope.proc.getStepNode(num)}`}
    );
  } else {
    $timeout(function () {
      callback("");
    });
  }
}

$scope.$watch("app.params.procID", function (newValue, oldValue) {
  if(newValue != oldValue) {
    if(newValue && proc2sequence[newValue]) {
      $scope.app.params.sequence = proc2sequence[newValue];
    } else {
      $scope.app.params.sequence = "";
    }
    acquireProcedureOutline(newValue, function(str){
      if(str) {
        $scope.proc = new Procedure(newValue, JSON.parse(str).content.outline);
      } else {
        $scope.proc = null;
      }
    });
  }
});

$scope.$watch("app.params.procStep", function (newValue, oldValue) {
  acquireProcedureStep($scope.app.params.procID, newValue, function(str){
    $scope.app.params.procStepHtml = $sce.trustAsHtml(str);
    $timeout(function() {
      var area = angular.element(getElementById(document, "stepArea"));
      var scripts = area.find("script");
      angular.forEach(scripts, function(el) {
        if(typeof el.attributes["src"] == "undefined") {
          eval(el.text);
        }
      });
    });
  });
  $scope.view.wdg['model-2'].currentStep = newValue + 0;
});

//debugger;
//var gll = require('app/resources/Uploaded/gl-matrix');
//debugger;

$scope.loadScript("app/resources/Uploaded/gl-matrix-norequire.js", function() {
  modelItemsById = {};
  modelItemsByPath = {};

  var widgets = $scope.app.view['Home'].wdg;
  var targetItem; // = $scope.app.view['Home'].wdg['modelItem-1'];

  // fill model structure
  var itemMatrix;
  var item;
  for(key in widgets) {
    if (widgets.hasOwnProperty(key)) {
      targetItem = widgets[key];
      if(/^modelItem-\d*$/.test(key)) {
        itemMatrix = mat4.create();
        mat4.translate(itemMatrix, itemMatrix, [targetItem['x'],targetItem['y'],targetItem['z']]);
        mat4.rotateZ(itemMatrix, itemMatrix, glMatrix.toRadian(targetItem['rz']));
        mat4.rotateY(itemMatrix, itemMatrix, glMatrix.toRadian(targetItem['ry']));
        mat4.rotateX(itemMatrix, itemMatrix, glMatrix.toRadian(targetItem['rx']));
        mat4.scale(itemMatrix, itemMatrix, [targetItem['scale'],targetItem['scale'],targetItem['scale']]);
        item = {id: key, path: targetItem.model + targetItem.idpath, matrix: itemMatrix, isTarget: true};
        modelItemsById[item.id] = item;
        modelItemsByPath[item.path] = item;
      } else if(/^model-\d*$/.test(key)) { //model
        itemMatrix = mat4.create();
        mat4.translate(itemMatrix, itemMatrix, [targetItem['x'],targetItem['y'],targetItem['z']]);
        mat4.rotateZ(itemMatrix, itemMatrix, glMatrix.toRadian(targetItem['rz']));
        mat4.rotateY(itemMatrix, itemMatrix, glMatrix.toRadian(targetItem['ry']));
        mat4.rotateX(itemMatrix, itemMatrix, glMatrix.toRadian(targetItem['rx']));
        mat4.scale(itemMatrix, itemMatrix, [targetItem['scale'],targetItem['scale'],targetItem['scale']]);
        item = {id: key, path: key, matrix: itemMatrix, isTarget: false};
        modelItemsById[item.id] = item;
        modelItemsByPath[item.path] = item;
      } else if(/^thingMark-\d*$/.test(key)) { //thingMark
        itemMatrix = mat4.create();
        mat4.translate(itemMatrix, itemMatrix, [targetItem['x'],targetItem['y'],targetItem['z']]);
        mat4.rotateZ(itemMatrix, itemMatrix, glMatrix.toRadian(targetItem['rz']));
        mat4.rotateY(itemMatrix, itemMatrix, glMatrix.toRadian(targetItem['ry']));
        mat4.rotateX(itemMatrix, itemMatrix, glMatrix.toRadian(targetItem['rx']));
        //mat4.scale(itemMatrix, itemMatrix, [targetItem['width'],targetItem['width'],targetItem['width']]);
        thingMarkMatrix = itemMatrix;
      }
    }
  }
  
  var pathes = Object.keys(modelItemsByPath);
  pathes.sort();

  //debugger;
  var n;
  var path;

  for(n = 0; n < pathes.length; n++) {
    key = pathes[n];
    console.log("Item: " + key + ", " + modelItemsByPath[key].id + (modelItemsByPath[key].isTarget?", target":"") + ": " + mat4.str(modelItemsByPath[key].matrix));
  }

  console.log("thingMark: " + mat4.str(thingMarkMatrix));

  // translate model structure into global coordinates
  for(n = 0; n < pathes.length; n++) {
    key = pathes[n];
    item = modelItemsByPath[key];
    for(var parentPath = getParentItemPath(item.path); parentPath != ""; parentPath = getParentItemPath(parentPath)) {
      var parentItem = modelItemsByPath[parentPath];
      if(parentItem) {
        mat4.multiply(item.matrix, parentItem.matrix, item.matrix);
        parentItem.isTarget = false;
        break;
      }
    }
  }
  
  for(n = 0; n < pathes.length; n++) {
    key = pathes[n];
    console.log("Item: " + key + ", " + modelItemsByPath[key].id + (modelItemsByPath[key].isTarget?", target":"") + ": " + mat4.str(modelItemsByPath[key].matrix));
  }

});

$scope.initModel = function() {
  /*
  $scope.setItemColor('model-2-/0',selectedColor);
  $scope.$applyAsync();
  $scope.unsetItemColor('model-2-/0');
  $scope.$applyAsync();
  */
  /*
  if(isMobile) {
      $scope.view.wdg['model-2'].shader='hide';
  }
  */
  /* demo_highlight_on
  $scope.view.wdg["model-2"].opacity = 0.75;
  $scope.view.wdg["model-2"].visibility = true;
  if(isMobile) {
    $scope.view.wdg['model-2'].shader = $scope.app.fn.isTrue($scope.app.params.vrMode) ? "Default" : "hide";
  }
  $scope.$applyAsync();
  */
}

$scope.playCurrentStep = function () {
  $scope.view.wdg['model-2'].play();
}

$scope.gotoNextStep = function() {
  if($scope.app.params.procStep < $scope.proc.getNumberOfSteps()) {
    $scope.app.params.procStep++;
  }
}

$scope.gotoPrevStep = function() {
  if($scope.app.params.procStep > 0) {
    $scope.app.params.procStep--;
  }
}
