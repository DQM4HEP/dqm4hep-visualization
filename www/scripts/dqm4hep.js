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
  
  LoggingBar = function() {
    var container = document.createElement('div');
    container.classList.add("dqm4hep-logging-bar");
    window.addEventListener('load', function() {
      document.body.appendChild(container);
    });
    
    var logMessage = function(color, message) {
      container.style.display = "block";
      container.innerHTML = message;
      container.style.backgroundColor = color;
      $(container).delay(2000).fadeOut(1000, function() {
        container.style.display = "none";
      });
    };
    
    var concatenateArguments = function(message) {
      return Array.from(arguments).map(function(arg) {
        return String(arg);
      }).join(" ");
    };
    
    this.all = function(message) {
      logMessage("#ccffdd", concatenateArguments(message));
    };
    
    this.debug = function(message) {
      logMessage("#ccffdd", concatenateArguments(message));
    };
    
    this.info = function(message) {
      logMessage("#99ccff", concatenateArguments(message));
    };
    
    this.warning = function(message) {
      logMessage("#ffff99", concatenateArguments(message));
    };
    
    this.error = function(message) {
      logMessage("#ff9999", concatenateArguments(message));
    };
    
    this.critical = function(message) {
      logMessage("#ff9999", concatenateArguments(message));
    };
  };
  
  dqm4hep.loggingBar = new LoggingBar();
  
  dqm4hep.loglevel = {
    all:       0,
    debug:     1,
    info:      2,
    warning:   3,
    error:     4,
    critical:  5
  };
  
  dqm4hep.logfunction = {
    all: function(message) {
      if((typeof console != 'undefined') && (typeof console.log == 'function')) {
       console.log(message);        
     }
      if(typeof jQuery != 'undefined') {
        dqm4hep.loggingBar.all(message);
      }
    },
    debug: function(message) {
      if((typeof console != 'undefined') && (typeof console.log == 'function')) {
       console.log(message);
     }
     if(typeof jQuery != 'undefined') {
       dqm4hep.loggingBar.debug(message);
     }
    },
    info: function(message) {
      if((typeof console != 'undefined') && (typeof console.info == 'function')) {
       console.info(message);
     }
     if(typeof jQuery != 'undefined') {
       dqm4hep.loggingBar.info(message);
     }
    },
    warning: function(message) {
      if((typeof console != 'undefined') && (typeof console.warn == 'function')) {
       console.warn(message);
      }
      if(typeof jQuery != 'undefined') {
        dqm4hep.loggingBar.warning(message);
      }
    },
    error: function(message) {
      if((typeof console != 'undefined') && (typeof console.error == 'function')) {
       console.error(message);
      }
      if(typeof jQuery != 'undefined') {
        dqm4hep.loggingBar.error(message);
      }
    },
    critical: function(message) {
      if((typeof console != 'undefined') && (typeof console.error == 'function')) {
       console.error(message);
      }
      if(typeof jQuery != 'undefined') {
        dqm4hep.loggingBar.critical(message);
      }
    }
  }
  
  var logLevel = dqm4hep.loglevel.info;
  
  dqm4hep.setLogLevel = function(level) {
    if(typeof level != 'number') {
      return;
    }
    if(level < dqm4hep.loglevel.all) {
      logLevel = dqm4hep.loglevel.all;
    }
    if(level > dqm4hep.loglevel.critical) {
      logLevel = dqm4hep.loglevel.critical;
    }
    logLevel = level;
  };
  
  dqm4hep.debug = function(message) {
    if(logLevel <= dqm4hep.loglevel.debug) {
      dqm4hep.logfunction.debug(message);
    }
  };
  
  dqm4hep.info = function(message) {
    if(logLevel <= dqm4hep.loglevel.info) {
      dqm4hep.logfunction.info(message);
    }
  };
  
  dqm4hep.warning = function(message) {
    if(logLevel <= dqm4hep.loglevel.warning) {
      dqm4hep.logfunction.warning(message);
    }
  };
  
  dqm4hep.error = function(message) {
    if(logLevel <= dqm4hep.loglevel.error) {
      dqm4hep.logfunction.error(message);
    }
  };
  
  dqm4hep.critical = function(message) {
    if(logLevel <= dqm4hep.loglevel.critical) {
      dqm4hep.logfunction.critical(message);
    }
  };

  var allScripts = [
    'jsroot/scripts/JSRootCore.js?2d&hist&hierarchy',
    'jsroot/scripts/jquery.min.js',
    'jsroot/scripts/jquery-ui.min.js',
    'jquery.layout-1.3.0.js',
    'jquery.fancytree-all-deps.min.js',
    'jquery.contextMenu.min.js',
    'reconnecting-websocket.min.js',
    'dqm4hep.core.js',
    'dqm4hep.net.js',
    'dqm4hep.monitoring.js'
  ];
  
  var allStyles = [
    "jquery-ui.css",
    "layout-default-latest.css",
    "fancytree/skin-lion/ui.fancytree.min.css",
    "jquery.contextMenu.min.css",
    "dqm4hep.monitoring.css"
  ];
  
  var headScripts = document.head.querySelectorAll("script");
  var scriptsPath = "";
  for(var n=0 ; n<headScripts.length ; n++) {
    var script = headScripts[n];
    var pos = script.src.search("dqm4hep.js");
    if(pos > 0) {
      var initLoglevel = script.getAttribute('data-loglevel');
      if(typeof initLoglevel == 'string') {
        if(Object.keys(dqm4hep.loglevel).indexOf(initLoglevel) > 0) {
          dqm4hep.setLogLevel(dqm4hep.loglevel[initLoglevel]);
        }
      }
      scriptsPath = script.src.substring(0, pos);
      break;
    }
  }
  var stylesheetsPath = scriptsPath + "../style/";
  dqm4hep.debug( "Set DQM4hep scripts path: " + scriptsPath );
  dqm4hep.debug( "Set DQM4hep stylesheets path: " + stylesheetsPath );
  
  function loadScripts(scripts){
    var script = scripts.shift();
    var element = document.createElement('script');
    document.head.appendChild(element);
    dqm4hep.debug( "DQM4hep adding script: " + scriptsPath + script );
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
    dqm4hep.debug( "DQM4hep adding stylesheet: " + stylesheetsPath + style );
    if(styles.length > 0) {
      loadStylesheets(styles);
    }
  }
  
  loadStylesheets(allStyles);
  loadScripts(allScripts);
});