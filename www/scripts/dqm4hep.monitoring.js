/**
 * @summary Javascript dqm4hep monitoring classes
 * @author Remi Ete
 * @copyright 2018
 * @since 24.06.2018
 */

(function (factory) {
  if(typeof dqm4hep != 'undefined' && typeof dqm4hep.monitoring != 'undefined') {
    throw new Error('DQM4hep monitoring script already loaded !', 'dqm4hep.monitoring.js');
  }
  else if(typeof dqm4hep != 'undefined' && typeof dqm4hep.monitoring == 'undefined') {
    factory(dqm4hep);
  }
  else if(typeof dqm4hep == 'undefined') {
    dqm4hep = {}
    factory(dqm4hep);
  }
})(function(dqm4hep) {
  // sub-namespace for monitoring classes
  dqm4hep.monitoring = {};

  MonitorElement = function(object) {
    this.rootObject = null;
    this.path = "";
    this.module = "";
    this.name = "";
    this.collector = "";
    this.runNumber = 0;
    this.description = "";
    this.qReports = {};
    this.updateEvent = new Event('update');
    this.updateEvent.element = this;
    this.element = document.createElement("null");
    this.update(object, false);
  };

  MonitorElement.prototype.addEventListener = function(type, listener, options) {
    this.element.addEventListener(type, listener, options);
  };

  MonitorElement.prototype.removeEventListener = function(type, listener, options) {
    this.element.removeEventListener(type, listener, options);
  };

  MonitorElement.prototype.update = function(object, emit) {
    this.rootObject = object.rootObject ? object.rootObject : null;
    this.path = object.path;
    this.module = object.module;
    this.name = object.rootObject ? object.rootObject.fName : (object.name ? object.name : "");
    this.collector = object.collector ? object.collector : "";
    this.runNumber = object.runNumber ? object.runNumber : 0;
    this.description = object.description ? object.description : "";
    this.qReports = object.qReports ? object.qReports : {};
    if(emit) {
      this.element.dispatchEvent(this.updateEvent);
    }
  }
  // export class
  dqm4hep.monitoring.MonitorElement = MonitorElement;



  CollectorTreeView = function(obj) {
    var self = this;
    this.collector = obj.collector;
    this.noHeader = typeof obj.noHeader == "boolean" ? obj.noHeader : false;
    this.container = document.createElement("div");
    this.buttonElement = null;
    if(!this.noHeader) {
      this.buttonElement = document.createElement("button");
      this.buttonElement.classList.add("dqm4hep-tree-view-button");
      this.buttonElement.innerHTML = this.collector;
    }
    this.treeElement = document.createElement("div");
    if(!this.noHeader) {
      this.treeElement.classList.add("dqm4hep-tree-view-content");
    }
    this.elementDblClick = typeof obj.elementDblClick === "function" ? obj.elementDblClick : null;
    this.updateRequested = typeof obj.updateRequested === "function" ? obj.updateRequested : null;
    this.drawRequested = typeof obj.drawRequested === "function" ? obj.drawRequested : null;

    $(this.treeElement).fancytree({
      selectMode: 2,
      collapse: function(event, data) {
        self.treeElement.style.maxHeight = self.treeElement.scrollHeight + "px";
      },
      expand: function(event, data) {
        self.treeElement.style.maxHeight = self.treeElement.scrollHeight + "px";
      },
      click: function(event, data) {
        if(data.targetType == "checkbox") {
          if(data.node) {
            var toCheck = !data.node.isSelected();
            data.node.visit(function(node) {
              if(node.isSelected() == toCheck) {
                return "skip";
              }
              node.setSelected(toCheck);
              return true;
            });
          }
        }
      },
      dblclick: function(event, data) {
        // monitor element case
        if(data.node && (data.node.children == null || data.node.children.length == 0)) {
          if(!data.node.isSelected()) {
            data.node.setSelected(true);
          }
          if(self.elementDblClick != null) {
            self.elementDblClick(event, {element: data.node.data});
          }
        }
        return true;
      },
      source: []
    });

    this.tree = $(this.treeElement).fancytree("getTree");
    
    if(!this.noHeader) {
      this.buttonElement.addEventListener("click", function() {
        this.classList.toggle("dqm4hep-tree-view-button-active");
        if (self.treeElement.style.maxHeight){
          self.treeElement.style.maxHeight = null;
        } else {
          self.treeElement.style.maxHeight = self.treeElement.scrollHeight + "px";
        }
      });
      this.container.appendChild(this.buttonElement);
    }

    this.container.appendChild(this.treeElement);
    
    if(obj.element) {
      obj.element.appendChild(this.container);
    }
    
    $(this.treeElement).contextmenu({
      delegate: "span.fancytree-node",
      menu: [
        {title: "Update", cmd: "update"},
        {title: "Draw in ...", children: [
          {title: "New area", cmd: "drawNew"},
          {title: "Current area", cmd: "drawCurrent"}
        ]},
        {title: "-----"},
        // {title: "Show info", cmd: "showInfo"},
        {title: "Remove", cmd: "remove"}
      ],
      beforeOpen: function(event, ui) {
        var node = $.ui.fancytree.getNode(ui.target);
        node.setActive();
      },
      select: function(event, ui) {
        var node = $.ui.fancytree.getNode(ui.target);
        if(!node) {
          return;
        }
        if(ui.cmd == "update") {
          if(self.updateRequested) {
            console.log("update callback");
            self.updateRequested(event, {element: node.data});
          }
        }
        else if(ui.cmd == "drawNew") {
          if(self.drawRequested) {
            console.log("drawNew callback");
            self.drawRequested(event, {element: node.data, current: false});
          }
        }
        else if(ui.cmd == "drawCurrent") {
          if(self.drawRequested) {
            console.log("drawCurrent callback");
            self.drawRequested(event, {element: node.data, current: true});
          }
        }
        else if(ui.cmd == "remove") {
          console.log("remove callback");
          node.remove();
        }
      }
    });
  };

  CollectorTreeView.prototype.moduleNames = function() {
    return this.tree.getRootNode().getChildren().map(function(child) {
      return child.title;
    });
  };

  CollectorTreeView.prototype.addModule = function(moduleName) {
    var moduleNode = this.tree.getRootNode().findFirst(moduleName);
    if(moduleNode === null) {
      moduleNode = this.tree.getRootNode().addChildren({
        title: moduleName,
        checkbox: true,
        folder: true
      });
    }
    return moduleNode;
  };

  CollectorTreeView.prototype.removeModule = function(moduleName) {
    var moduleNode = this.tree.getRootNode().findFirst(moduleName);
    if(moduleNode) {
      moduleNode.remove();
    }
  };

  CollectorTreeView.prototype.moduleExists = function(moduleName) {
    return (this.tree.getRootNode().findFirst(moduleName) === null);
  };

  CollectorTreeView.prototype.clear = function() {
    this.tree.clear();
  };

  CollectorTreeView.prototype.findDirectory = function(moduleName, directories) {
    var dirList = [moduleName].concat(directories);
    var currentNode = this.tree.getRootNode();;
    for(var index = 0 ; index<dirList.length ; index++) {
      var dirName = dirList[index];
      if(dirName.length == 0) {
        continue;
      }
      var directory = currentNode.findFirst(dirName);
      if(directory === null) {
        return null;
      }
      currentNode = directory;
    }
    return currentNode;
  };

  CollectorTreeView.prototype.mkdir = function(moduleName, directories) {
    var moduleNode = this.addModule(moduleName);
    var currentNode = moduleNode;
    for(var index = 0 ; index<directories.length ; index++) {
      var dirName = directories[index];
      if(dirName.length == 0) {
        continue;
      }
      var directory = currentNode.findFirst(dirName);
      if(directory === null) {
        directory = currentNode.addChildren({
          title: dirName,
          checkbox: true,
          folder: true
        });
      }
      currentNode = directory;
    }
    return currentNode;
  };

  CollectorTreeView.prototype.addElement = function(object) {
    var directory = this.mkdir(object.module, object.path.split("/"));
    var elementNode = directory.findFirst(object.name);
    if(elementNode === null) {
      elementNode = directory.addChildren({
        title: object.name,
        checkbox: true,
        folder: false,
        icon: false
      });
      elementNode.data = new MonitorElement(object);
    }
    else {
      elementNode.data.update(object);
    }
    elementNode.tooltip = this.generateToolTip(object);
    elementNode.data.collector = this.collector;
    return elementNode;
  };

  CollectorTreeView.prototype.removeElement = function(object) {
    var directory = this.findDirectory(obj.module, obj.path.split("/"));
    if(directory) {
      var elementNode = directory.findFirst(obj.name);
      if(elementNode) {
        elementNode.remove();
      }
    }
  };

  CollectorTreeView.prototype.selectedElements = function() {
    return this.tree.getSelectedNodes().filter(function(node) {
      return !node.isFolder();
    }).map(function(node) {
      return node.data;
    });
  };

  CollectorTreeView.prototype.unCheckAll = function() {
    return this.tree.selectAll(false);
  };


  CollectorTreeView.prototype.generateToolTip = function(element) {
    var tooltip = "";
    tooltip += "Name: " + element.name + "\n";
    tooltip += "Path: " + element.path + "\n";
    tooltip += "Module: " + element.module + "\n";
    tooltip += "Collector: " + element.collector + "\n";
    tooltip += "Run: " + element.runNumber + "\n";
    tooltip += "Description: " + element.description + "\n";
    return tooltip;
  };

  dqm4hep.monitoring.CollectorTreeView = CollectorTreeView;


  //-----------------------------------------------------------

  MultiCollectorTreeView = function(obj) {
    var self = this;
    this.container = document.createElement("div");
    this.collectorViews = {};
    this.elementDblClick = typeof obj.elementDblClick === "function" ? obj.elementDblClick : null;
    this.updateRequested = typeof obj.updateRequested === "function" ? obj.updateRequested : null;
    this.drawRequested = typeof obj.drawRequested === "function" ? obj.drawRequested : null;
    
    // view construction
    this.container.classList.add("dqm4hep-multiview-container");
    this.header = document.createElement("p");
    this.header.innerHTML = "Monitor elements";
    this.header.classList.add("dqm4hep-multiview-header");
    this.container.appendChild(this.header);
    if(obj.element) {
      obj.element.appendChild(this.container);
    }
  };


  MultiCollectorTreeView.prototype.collectorNames = function() {
    return Object.keys(this.collectorViews);
  };


  MultiCollectorTreeView.prototype.addElement = function(element) {
    if(element == null) {
      return;
    }
    var collectorView;
    var self = this;
    if(!this.collectorViews.hasOwnProperty(element.collector)) {
      collectorView = new CollectorTreeView({
        element: self.container,
        collector: element.collector,
        elementDblClick: self.elementDblClick,
        updateRequested: self.updateRequested,
        drawRequested: self.drawRequested,
        noHeader: false
      });
      this.collectorViews[element.collector] = collectorView;
    }
    else {
      collectorView = this.collectorViews[element.collector];
    }
    collectorView.addElement(element);
  };

  MultiCollectorTreeView.prototype.removeCollector = function(collector) {
    if(this.collectorViews.hasOwnProperty(collector)) {
      var collectorView = this.collectorViews[collector];
      this.container.removeChild(collectorView.container);
      delete this.collectorViews[collector];
    }
  };


  MultiCollectorTreeView.prototype.selectedElements = function(collector) {
    if(collector != undefined) {
      if(this.collectorViews.hasOwnProperty(collector)) {
        var collectorView = this.collectorViews[collector];
        return collectorView.selectedElements();
      }
      return [];
    }
    var selected = [];
    var collectors = Object.keys(this.collectorViews);
    for(var index = 0 ; index<collectors.length ; index++ ) {
      var localSelected = this.collectorViews[collectors[index]].selectedElements();
      selected = selected.concat(localSelected);
    }
    return selected;
  };


  MultiCollectorTreeView.prototype.unCheckAll = function(collector) {
    if(collector != undefined) {
      if(this.collectorViews.hasOwnProperty(collector)) {
        var collectorView = this.collectorViews[collector];
        collectorView.unCheckAll();
      }
      return;
    }
    var collectors = Object.keys(this.collectorViews);
    for(var index = 0 ; index<collectors.length ; index++ ) {
      this.collectorViews[collectors[index]].unCheckAll();
    }
  };

  MultiCollectorTreeView.prototype.removeElement = function(object) {
    if(this.collectorViews.hasOwnProperty(object.collector)) {
      var collectorView = this.collectorViews[collector];
      collectorView.removeElement(object);
    }
  };

  MultiCollectorTreeView.prototype.clear = function(collector) {
    if(collector != undefined) {
      this.removeCollector(collector);
      return;
    }
    var collectors = Object.keys(this.collectorViews);
    for(var index = 0 ; index<collectors.length ; index++ ) {
      this.removeCollector([collectors[index]]);
    }
  };
  
  dqm4hep.monitoring.MultiCollectorTreeView = MultiCollectorTreeView;

  //-----------------------------------------------------------

  RootCanvas = function(object) {
    var self = this;
    this.element = document.createElement("null");
    this.closeEvent = new Event('close');
    this.container = document.createElement("div");
    this.container.classList.add("root-canvas");
    this.monitorElement = null;
    this.update(object.monitorElement, false);
    object.parent.appendChild(this.container);
    $(this.container).dialog({
      width: 300,
      height: 200,
      position: {my: "left top", at: "left top", of: object.parent},
      resize: function(event, ui) {
        JSROOT.resize(self.container, {width: ui.size.width, height: ui.size.height});
      },
      close: function(event, ui) {
        self.element.dispatchEvent(self.closeEvent);
      },
      appendTo: object.parent
    });
    JSROOT.resize(this.container, true);
  };

  RootCanvas.prototype.addEventListener = function(type, listener, options) {
    this.element.addEventListener(type, listener, options);
  };

  RootCanvas.prototype.removeEventListener = function(type, listener, options) {
    this.element.removeEventListener(type, listener, options);
  };

  RootCanvas.prototype.update = function(element) {
    this.monitorElement = element;
    var drawOption = "";
    var drawObject = null;
    if(this.monitorElement.rootObject) {
      drawOption = this.monitorElement.rootObject.fDrawOption ? this.monitorElement.rootObject.fDrawOption : "";
      drawObject = this.monitorElement.rootObject;
    }
    else {
      drawObject = JSROOT.Create("TPaveText");
      // drawObject.AddText("   NO VIS   ");
      
    }
    JSROOT.redraw(this.container, drawObject, drawOption);      
    JSROOT.resize(this.container, true);
    JSROOT.RegisterForResize(this.container);
    // else {
    //   var context = this.noVisCanvas.getContext('2d');
    //   context.drawImage(this.noVisImage, 0, 0);
    //   console.log("set image as current");
    //   this.setCurrent(this.noVisCanvas);
    // }
  }

  dqm4hep.monitoring.RootCanvas = RootCanvas;

  // RootCanvas.prototype.getNoVisImage = function() {
  //   if(!this.noVisImage) {
  //     var self = this;
  //     this.noVisImage = new Image();
  //     var context = this.noVisCanvas.getContext('2d');
  //     this.noVisImage.onload = function () {
  //       context.drawImage(self.noVisImage, 0, 0);
  //     }
  //     this.noVisImage.src = 'ressources/NO_VIS.xpm';
  //   }
  //   return this.noVisImage;
  // }

  return dqm4hep;
});
