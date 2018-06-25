/** @file dqm4hep.js
 * Main file to include for web interface */

/** @namespace dqm4hep
  * Holder of all dqm4hep functions and classes */
  
(function (factory) {

  if(typeof dqm4hep != 'undefined') {
    throw new Error('DQM4hep scripts already loaded !', 'dqm4hep.js');
  }

  dqm4hep = {}
  factory(dqm4hep);
  
})(function(dqm4hep) {

  var allScripts = [
    'jsroot/scripts/JSRootCore.js?2d&hist&hierarchy',
    'jsroot/scripts/jquery.min.js',
    'jsroot/scripts/jquery-ui.min.js',
    'jquery.layout-1.3.0.js',
    'fancytree/dist/jquery.fancytree-all-deps.min.js',
    'jquery.contextMenu.min.js',
    'reconnecting-websocket.min.js',
    'dqm4hep.core.js',
    'dqm4hep.net.js',
    'dqm4hep.monitoring.js'
  ];
  
  var allStyles = [
    "jquery-ui.css",
    "layout-default-latest.css",
    "ui.fancytree.min.css",
    "jquery.contextMenu.min.css",
    "dqm4hep.monitoring.css"
  ];
  
  var headScripts = document.head.querySelectorAll("script");
  var scriptsPath = "";
  for(var n=0 ; n<headScripts.length ; n++) {
    var script = headScripts[n];
    var pos = script.src.search("dqm4hep.js");
    if(pos > 0) {
      scriptsPath = script.src.substring(0, pos);
      break;
    }
  }
  var stylesheetsPath = scriptsPath + "../style/";
  console.log( "Set DQM4hep scripts path: " + scriptsPath );
  console.log( "Set DQM4hep stylesheets path: " + stylesheetsPath );
  
  function loadScripts(scripts){
    var script = scripts.shift();
    var element = document.createElement('script');
    document.head.appendChild(element);
    element.onload = function(evt){
      if (scripts.length) {
          loadScripts(scripts);
      }
    };
    element.src = scriptsPath + script;    
  }
  
  function loadStylesheets(styles){
    var style = styles.shift();
    var element = document.createElement("link");
    element.setAttribute("rel", "stylesheet");
    element.setAttribute("type", "text/css");
    element.setAttribute("href", stylesheetsPath + style);
    document.head.appendChild(element);
    if(styles.length > 0) {
      loadStylesheets(styles);
    }
  }
  
  loadStylesheets(allStyles);
  loadScripts(allScripts);
});