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

  dqm4hep.monitoring.CollectorTreeView = function(obj) {
    var self = this;
    var collector = obj.collector;
    var noHeader = typeof obj.noHeader == "boolean" ? obj.noHeader : false;
    var container = document.createElement("div");
    var buttonElement = null;
    
    if(!noHeader) {
      buttonElement = document.createElement("button");
      buttonElement.classList.add("dqm4hep-tree-view-button");
      buttonElement.innerHTML = collector;
    }
    var treeElement = document.createElement("div");
    if(!noHeader) {
      treeElement.classList.add("dqm4hep-tree-view-content");
    }
    var elementDblClick = typeof obj.elementDblClick == "function" ? obj.elementDblClick : null;
    var updateRequested = typeof obj.updateRequested == "function" ? obj.updateRequested : null;
    var drawRequested = typeof obj.drawRequested == "function" ? obj.drawRequested : null;

    $(treeElement).fancytree({
      selectMode: 2,
      collapse: function(event, data) {
        treeElement.style.maxHeight = treeElement.scrollHeight + "px";
      },
      expand: function(event, data) {
        treeElement.style.maxHeight = treeElement.scrollHeight + "px";
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
          if(elementDblClick != null) {
            elementDblClick(event, {element: data.node.data});
          }
        }
        return true;
      },
      source: []
    });

    var tree = $(treeElement).fancytree("getTree");
    
    if(!noHeader) {
      buttonElement.addEventListener("click", function() {
        this.classList.toggle("dqm4hep-tree-view-button-active");
        if (treeElement.style.maxHeight){
          treeElement.style.maxHeight = null;
        } else {
          treeElement.style.maxHeight = treeElement.scrollHeight + "px";
        }
      });
      container.appendChild(buttonElement);
    }

    container.appendChild(treeElement);
    
    if(obj.element) {
      obj.element.appendChild(container);
    }
    
    $(treeElement).contextMenu({
      selector: "span.fancytree-node",
      items: {
        "update": {name: "Update"},
        "draw": {name: "Draw in ...", items: {
          "drawNew": {name: "New area"},
          "drawCurrent": {name: "Current area"}
          }
        },
        "sep1": "-------",
        "remove": {name: "Remove"}
      },
      zIndex: 2,
      callback: function(key, options) {
        console.log(options.$trigger);
        
        var node = $.ui.fancytree.getNode(options.$trigger);
        if(!node) {
          return;
        }
        if(key == "update") {
          if(updateRequested) {
            console.log("update callback");
            updateRequested({element: node.data});
          }
        }
        else if(key == "drawNew") {
          if(drawRequested) {
            console.log("drawNew callback");
            drawRequested({element: node.data, current: false});
          }
        }
        else if(key == "drawCurrent") {
          if(drawRequested) {
            console.log("drawCurrent callback");
            drawRequested({element: node.data, current: true});
          }
        }
        else if(key == "remove") {
          console.log("remove callback");
          node.remove();
        }
      }
    });
    
    var generateToolTip = function(element) {
      var tooltip = "";
      tooltip += "Name: " + element.name + "\n";
      tooltip += "Path: " + element.path + "\n";
      tooltip += "Module: " + element.module + "\n";
      tooltip += "Collector: " + element.collector + "\n";
      tooltip += "Run: " + element.runNumber + "\n";
      tooltip += "Description: " + element.description + "\n";
      return tooltip;
    };
    
    this.moduleNames = function() {
      return tree.getRootNode().getChildren().map(function(child) {
        return child.title;
      });
    };
    
    this.addModule = function(moduleName) {
      var moduleNode = tree.getRootNode().findFirst(moduleName);
      if(moduleNode === null) {
        moduleNode = tree.getRootNode().addChildren({
          title: moduleName,
          checkbox: true,
          folder: true
        });
      }
      return moduleNode;
    };
    
    this.removeModule = function(moduleName) {
      var moduleNode = tree.getRootNode().findFirst(moduleName);
      if(moduleNode) {
        moduleNode.remove();
      }
    };
    
    this.moduleExists = function(moduleName) {
      return (tree.getRootNode().findFirst(moduleName) === null);
    };

    this.clear = function() {
      tree.clear();
    };
    
    this.findDirectory = function(moduleName, directories) {
      var dirList = [moduleName].concat(directories);
      var currentNode = tree.getRootNode();;
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
    
    this.mkdir = function(moduleName, directories) {
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
    
    this.addElement = function(object) {
      var directory = this.mkdir(object.module, object.path.split("/"));
      var elementNode = directory.findFirst(object.name);
      if(elementNode === null) {
        elementNode = directory.addChildren({
          title: object.name,
          checkbox: true,
          folder: false,
          icon: false
        });
        elementNode.data = new dqm4hep.core.MonitorElement(object);
      }
      else {
        elementNode.data.update(object);
      }
      elementNode.tooltip = generateToolTip(object);
      elementNode.data.collector = collector;
      return elementNode;
    };
    
    this.removeElement = function(object) {
      var directory = this.findDirectory(obj.module, obj.path.split("/"));
      if(directory) {
        var elementNode = directory.findFirst(obj.name);
        if(elementNode) {
          elementNode.remove();
        }
      }
    };

    this.selectedElements = function() {
      return tree.getSelectedNodes().filter(function(node) {
        return !node.isFolder();
      }).map(function(node) {
        return node.data;
      });
    };

    this.unCheckAll = function() {
      return tree.selectAll(false);
    };

  };


  //-----------------------------------------------------------

  dqm4hep.monitoring.MultiCollectorTreeView = function(obj) {
    var container = document.createElement("div");
    var collectorViews = {};
    var elementDblClick = typeof obj.elementDblClick === "function" ? obj.elementDblClick : null;
    var updateRequested = typeof obj.updateRequested === "function" ? obj.updateRequested : null;
    var drawRequested = typeof obj.drawRequested === "function" ? obj.drawRequested : null;
    
    // view construction
    container.classList.add("dqm4hep-multiview-container");
    var header = document.createElement("p");
    header.innerHTML = "Monitor elements";
    header.classList.add("dqm4hep-multiview-header");
    container.appendChild(header);
    if(obj.element) {
      obj.element.appendChild(container);
    }
    
    this.collectorNames = function() {
      return Object.keys(collectorViews);
    };
    
    this.addElement = function(element) {
      if(element == null) {
        return;
      }
      var collectorView;
      if(!collectorViews.hasOwnProperty(element.collector)) {
        collectorView = new dqm4hep.monitoring.CollectorTreeView({
          element: container,
          collector: element.collector,
          elementDblClick: elementDblClick,
          updateRequested: updateRequested,
          drawRequested: drawRequested,
          noHeader: false
        });
        collectorViews[element.collector] = collectorView;
      }
      else {
        collectorView = collectorViews[element.collector];
      }
      collectorView.addElement(element);
    };
    
    this.removeCollector = function(collector) {
      if(collectorViews.hasOwnProperty(collector)) {
        var collectorView = collectorViews[collector];
        container.removeChild(collectorView.container);
        delete collectorViews[collector];
      }
    };
    
    this.selectedElements = function(collector) {
      if(collector != undefined) {
        if(collectorViews.hasOwnProperty(collector)) {
          var collectorView = collectorViews[collector];
          return collectorView.selectedElements();
        }
        return [];
      }
      var selected = [];
      var collectors = Object.keys(collectorViews);
      for(var index = 0 ; index<collectors.length ; index++ ) {
        var localSelected = collectorViews[collectors[index]].selectedElements();
        selected = selected.concat(localSelected);
      }
      return selected;
    };
    
    this.unCheckAll = function(collector) {
      if(collector != undefined) {
        if(collectorViews.hasOwnProperty(collector)) {
          var collectorView = collectorViews[collector];
          collectorView.unCheckAll();
        }
        return;
      }
      var collectors = Object.keys(collectorViews);
      for(var index = 0 ; index<collectors.length ; index++ ) {
        collectorViews[collectors[index]].unCheckAll();
      }
    };

    this.removeElement = function(object) {
      if(collectorViews.hasOwnProperty(object.collector)) {
        var collectorView = collectorViews[collector];
        collectorView.removeElement(object);
      }
    };

    this.clear = function(collector) {
      if(collector != undefined) {
        this.removeCollector(collector);
        return;
      }
      var collectors = Object.keys(collectorViews);
      for(var index = 0 ; index<collectors.length ; index++ ) {
        this.removeCollector([collectors[index]]);
      }
    };
    
  };

  //-----------------------------------------------------------

  dqm4hep.monitoring.RootCanvas = function(object) {
    var self = this;
    var element = document.createElement("null");
    var closeEvent = new Event('close');
    var container = document.createElement("div");
    container.classList.add("dqm4hep-root-canvas");
    var monitorElement = null;
    object.parent.appendChild(container);
    var dialog = $(container).dialog({
      width: 300,
      height: 200,
      position: {my: "left top", at: "left top", of: object.parent},
      resize: function(event, ui) {
        JSROOT.resize(container, {width: ui.size.width, height: ui.size.height});
      },
      close: function(event, ui) {
        element.dispatchEvent(self.closeEvent);
        if(monitorElement != null) {
          monitorElement.removeEventListener('update', handleMonitorElementUpdate);
        }
      },
      appendTo: object.parent
    });
    
    this.update(object.element, false);
    JSROOT.resize(this.container, true);
    
    this.handleMonitorElementUpdate = function(event) {
      this.update(event.element);
    };

    this.addEventListener = function(type, listener, options) {
      element.addEventListener(type, listener, options);
    };

    this.removeEventListener = function(type, listener, options) {
      element.removeEventListener(type, listener, options);
    };

    this.update = function(element) {
      if(monitorElement != null) {
        monitorElement.removeEventListener('update', handleMonitorElementUpdate);
      }
      monitorElement = element;
      if(monitorElement != null) {
        monitorElement.addEventListener('update', handleMonitorElementUpdate);
      }
      var drawOption = "";
      var drawObject = null;
      if(monitorElement !== null && monitorElement.object) {
        drawOption = monitorElement.object.fDrawOption ? monitorElement.object.fDrawOption : "";
        drawObject = monitorElement.object;
        $(container).dialog("option", "title", "");
      }
      else {
        drawObject = JSROOT.Create("TPaveText");
        $(container).dialog("option", "title", monitorElement.name + " (" + monitorElement.module + ")");
      }
      JSROOT.redraw(container, drawObject, drawOption);      
      JSROOT.resize(container, true);
      JSROOT.RegisterForResize(container);
    };

    this.close = function() {
      $(container).dialog("close");
    }
  };



  //-----------------------------------------------------------


  dqm4hep.monitoring.CanvasArea = function(container) {
    var container = container;
    container.classList.add("dqm4hep-canvas-area-container");
    var canvases = [];
    
    this.getCanvas = function(element) {
      if(!this.checkElement(element)) {
        return null;
      }
      for(var index=0 ; index<canvases.length ; index++) {
        var canvas = canvases[index];
        if(this.checkElement(canvas.monitorElement)) {
          continue;
        }
        if(element == canvas.monitorElement) {
          return canvas;
        }
        if(element.propertiesEquals(canvas.monitorElement)) {
          return canvas;
        }
      }
      return null;
    };


    this.createCanvas = function(element) {
      var canvas = this.getCanvas(element);
      if(null == canvas) {
        canvas = new dqm4hep.monitoring.RootCanvas({
          parent: container,
          element: element
        });
        canvases.push(canvas);
      }
      return canvas;
    };

    this.checkElement = function(element) {
      if(element === undefined || element === null) {
        return false;
      }
      if(element.object.name === undefined || element.object.name.length == 0) {
        return false;
      }
      if(element.path === undefined) {
        return false;
      }
      if(element.module === undefined || element.module.length == 0) {
        return false;
      }
      if(element.collector === undefined || element.collector.length == 0) {
        return false;
      }
      return true;
    };

    this.isElementDrawn = function(element) {
      return (null == this.getCanvas(element));
    };

    this.nCanvases = function() {
      return canvases.length;
    };

    this.draw = function(element) {
      return this.createCanvas(element);
    };

    this.clear = function() {
      console.log("N canvases to clear : " + canvases.length.toString());
      for(var index=0 ; index<canvases.length ; index++) {
        var canvas = canvases[index];
        canvas.close();
        delete canvas;
      }
      canvases = [];
    };
  };



  //-----------------------------------------------------------

  dqm4hep.monitoring.MultiCanvasView = function(element) {
    var container = element;
    var tabsElement = document.createElement('ul');
    container.classList.add('dqm4hep-multicanvas');
    container.appendChild(tabsElement);
    var guid = new dqm4hep.core.UID();
    $(container).tabs({
      heightStyle: "fill"
    });
    var initContextMenu = false;
    
    
    var buildCanvasTabId = function(index) {
      return "canvas-area-tab-id-" + index.toString();
    }
    
    this.setCanvasAreaTitle = function(id, title) {
      if(id >= this.nCanvasAreas()) {
        return;
      }
      var tab = tabsElement.children[id];
      var span = tab.querySelector("a > span").innerHTML = title;
    }

    this.createCanvasArea = function(title) {
      if(title === undefined) {
        title = "Canvas area";
      }
      // canvas area id
      var canvasId = guid.getUID();
      var canvasTabId = buildCanvasTabId(canvasId);
      
      // create the ul element
      var liElement = document.createElement('li');
      var anchorElement = document.createElement('a');
      var spanElement = document.createElement('span');
      spanElement.innerHTML = title;
      anchorElement.appendChild(spanElement);
      liElement.appendChild(anchorElement);
      anchorElement.href = "#" + canvasTabId;
      $(anchorElement).data('tabElement', liElement);
      tabsElement.appendChild(liElement);
      
      // create the tab element
      var tabElement = document.createElement('div');
      tabElement.id = canvasTabId;
      var canvasArea = new dqm4hep.monitoring.CanvasArea(tabElement);
      $(tabElement).data('canvasArea', canvasArea);
      container.appendChild(tabElement);
      $(anchorElement).data('canvasArea', canvasArea);
      
      // refresh
      $(container).tabs("refresh");
      $(container).tabs("option", "active", canvasId);
      
      // create context menus if not
      if(!initContextMenu) {
        $(document).contextMenu(this.contextMenuData(".dqm4hep-multicanvas ul,.dqm4hep-multicanvas li span, .dqm4hep-multicanvas div.ui-tabs-panel"));
      }
      return canvasArea;
    }

    this.getCanvasAreaByIndex = function(index) {
      if(index < 0 || index >= this.nCanvasAreas()) {
        return null;
      }
      var tab = container.children[index+1];
      return $(tab).data('canvasArea');
    }


    this.nCanvasAreas = function() {
      return tabsElement.children.length;
    }

    this.currentCanvasArea = function() {
      if(this.nCanvasAreas() > 0) {
        var canvasId = $(container).tabs("option", "active");
        // +1 because at 0 we have the list of tabs in a <ul> element
        // Real tab div ids start at 1
        var canvasElement = container.children[canvasId+1];
        console.log(canvasElement);
        return $(canvasElement).data('canvasArea');
      }
      return null;
    }

    this.closeTab = function(closeIndex) {
      if(closeIndex === undefined || closeIndex < 0 || closeIndex >= this.nCanvasAreas()) {
        return;
      }
      var tabElement = tabsElement.querySelectorAll("li")[closeIndex];
      var canvasElement = container.children[closeIndex+1];
      var canvasArea = $(canvasElement).data('canvasArea');
      canvasArea.clear();
      tabsElement.removeChild(tabElement);
      container.removeChild(canvasElement);
      $(container).tabs("refresh");
      if(this.nCanvasAreas() == 0) {
        this.createCanvasArea();
      }
    }

    this.closeAll = function(exceptId) {
      var localTabElements = tabsElement.querySelectorAll("li");
      var exceptTabElement = null;
      var exceptCanvasElement = null;
      var exceptCanvasArea = null;
      
      for(var index=0 ; index<localTabElements.length ; index++) {
        
        var tabElement = localTabElements[index];
        var canvasElement = this.container.children[index+1];
        var canvasArea = $(canvasElement).data('canvasArea');
        
        if(exceptId !== undefined && exceptId == index) {
          exceptTabElement = tabElement;
          exceptCanvasElement = canvasElement;
          exceptCanvasArea = canvasArea;
          continue;
        }  
        canvasArea.clear();
      }
      
      if(exceptTabElement != null) {
        // close all except one
        // close all and restore initial state with one canvas area
        while (tabsElement.firstChild) {
          tabsElement.removeChild(tabsElement.firstChild);
        }
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        container.appendChild(tabsElement);
        container.appendChild(exceptCanvasElement);
        tabsElement.appendChild(exceptTabElement);
        $(container).tabs("refresh");
      }
      else {
        // close all and restore initial state with one canvas area
        while (tabsElement.firstChild) {
          tabsElement.removeChild(tabsElement.firstChild);
        }
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        container.appendChild(tabsElement);
        this.createCanvasArea();    
      }
    }

    this.contextMenuData = function(selector) {
      var self = this;
      return {
        selector: selector,
        items: {
          "close": {name: "Close area"},
          "closeAll": {name: "Close all areas"},
          "closeOthers": {name: "Close others areas"},
          "sep1": "-----",
          "rename": {name: "Rename area"},
          "new": {name: "New area"},
          "clear": {name: "Clear area"}
        },
        callback: function(key, options) {
          var target = options.$trigger[0];
          if(key == "rename") {
            var reply = prompt("Canvas area name:");
            if(null != reply && reply.trim().length > 0) {
              var newName = reply.trim();
              // right click on the tab directly
              if(target.nodeName.toLowerCase() == "span") {
                target.innerHTML = newName;
              }
              // any other place means the current canvas id
              else {
                var currentId = $(container).tabs("option", "active");
                self.setCanvasAreaTitle(currentId, newName);
              }
            }
          }
          else if(key == "new") {
            self.createCanvasArea();
          }
          else if(key == "clear") {
            // right click on the tab directly
            if(target.nodeName.toLowerCase() == "span") {
              var index = $(tabsElement.children).index(target.parentElement.parentElement);
              var canvasArea = self.getCanvasAreaByIndex(index);
              if(canvasArea != null) {
                canvasArea.clear();
              }
            }
            // any other place means the current canvas id
            else {
              var current = self.currentCanvasArea();
              if(null != current) {
                current.clear();
              }
            }
          }
          else if(key == "close") {
            var index = -1;
            // right click on the tab directly
            if(target.nodeName.toLowerCase() == "span") {
              index = $(tabsElement.children).index(target.parentElement.parentElement);
            }
            else {
              index = $(container).tabs("option", "active");
            }
            self.closeTab(index);
          }
          else if(key == "closeAll") {
            self.closeAll();
          }
          else if(key == "closeOthers") {
            // right click on the tab directly
            if(target.nodeName.toLowerCase() == "span") {
              index = $(tabsElement.children).index(target.parentElement.parentElement);
              self.closeAll(index);
            }
            // any other place means the current canvas id
            else {
              var currentId = $(container).tabs("option", "active");
              self.closeAll(currentId);
            }
          }
        }
      };
    }
  }



  //-----------------------------------------------------------

  dqm4hep.monitoring.DataTable = function(data) {
    var self = this;
    var filterElement = document.createElement('input');
    filterElement.classList.add("dqm4hep-datatable-filter");
    filterElement.type = "text";
    filterElement.placeholder = "Filter";
    
    var tableElement = document.createElement('table');
    tableElement.classList.add("dqm4hep-datatable");
    var theadElement = document.createElement('thead');

    tableElement.appendChild(theadElement);
    var tbodyElement = document.createElement('tbody');
    tableElement.appendChild(tbodyElement);
    var trtheadElement = document.createElement('tr');
    theadElement.appendChild(trtheadElement);
    
    var width = 100. / data.headerLabels.length;
    
    $(tableElement).contextMenu({
      selector: "tr",
      className: "dqm4hep-datatable-ctx-title",
      items: {
        "check": {name: "Check all"},
        "uncheck": {name: "Uncheck all"}
      },
      zIndex: 5,
      callback: function(key, options) {
        var target = options.$trigger;
        if(key == "check") {
          self.setCheckState(true);
        }
        else if(key == "uncheck") {
          self.setCheckState(false);
        }
      }
    });
    
    var setHeaderLabels = function(labels) {
      for(var index=0 ; index<labels.length ; index++) {
        var headerLabel = document.createElement('td');
        headerLabel.innerHTML = labels[index];
        headerLabel.style.width = width.toString() + "%";
        trtheadElement.appendChild(headerLabel);
      }
    };
    
    this.addRow = function(row) {
      var tableRow = document.createElement('tr');
      $(tableRow).dblclick(function() {
        var checkbox = tableRow.firstChild.firstChild;
        checkbox.checked = ! checkbox.checked;
      });
      tbodyElement.appendChild(tableRow);
      for(var index=0 ; index<row.length ; index++) {
        var rowData = document.createElement('td');
        if(index == 0) {
          var checkbox = document.createElement('input');
          checkbox.type = "checkbox";
          rowData.appendChild(checkbox);
          var text = document.createTextNode(row[index]);
          rowData.appendChild(text);
        }
        else {
          rowData.innerHTML = row[index];
        }
        
        rowData.style.width = width.toString() + "%";
        tableRow.appendChild(rowData);
      }
    }
    
    this.removeRow = function(index) {
      var rows = tbodyElement.querySelectorAll('tr');
      if(rows.length >= index) {
        return;
      }
      var row = rows[index];
      tbodyElement.removeChild(row);
    };
    
    this.setCheckState = function(checked) {
      $(tbodyElement.querySelectorAll('tr')).not('[display="none"]').find("td input").each(function (index, element){
        element.checked = checked;
      });
    };
    
    this.clear = function() {
      $(tbodyElement).empty();
    }
    
    data.parent.appendChild(filterElement);
    data.parent.appendChild(tableElement);
    setHeaderLabels(data.headerLabels);
    
    filterElement.onkeyup = function() {
      var filter = filterElement.value.toUpperCase();
      var tr = tbodyElement.getElementsByTagName('tr');
      for(var index=0 ; index<tr.length ; index++) {
        var currentTr = tr[index];
        var td = currentTr.getElementsByTagName('td');
        if(td) {
          for(var index2=0 ; index2<td.length ; index2++) {
            var currentTd = td[index2];
            var textString = currentTd.innerText;
            var found = textString.toUpperCase().indexOf(filter);
            if(found > -1) {
              currentTr.style.display = "";
              break;
            }
            else {
              currentTr.style.display = "none";
            }
          }
        }
      }
    };
  }

  //-----------------------------------------------------------

  dqm4hep.monitoring.Browser = function(iparent) {
    var parent = iparent;
    var container = document.createElement('div');
    container.classList.add('dqm4hep-browser-container');
    parent.appendChild(container);
    
    // The connexion area
    var connectionContainer = document.createElement('fieldset');
    connectionContainer.classList.add('dqm4hep-browser-connect');
    var connectionLegend = document.createElement('legend');
    connectionLegend.innerHTML = "Connexion";
    connectionContainer.appendChild(connectionLegend);
    
    // "Host" label
    var connectionHostLabel = document.createElement('p');
    connectionHostLabel.innerHTML = "Host: ";
    connectionContainer.appendChild(connectionHostLabel);
    // host input text
    var connectionHostInput = document.createElement('input');
    connectionHostInput.innerHTML = "localhost";
    connectionContainer.appendChild(connectionHostInput);
    
    // "Port" label
    var connectionPortLabel = document.createElement('p');
    connectionPortLabel.innerHTML = "Port: ";
    connectionContainer.appendChild(connectionPortLabel);
    // Port text input
    var connectionPortInput = document.createElement('input');
    connectionPortInput.type = "number";
    connectionPortInput.min = 0;
    connectionPortInput.max = 65535;
    connectionPortInput.pattern = '/^\d+$/';
    connectionPortInput.value = "0";
    connectionContainer.appendChild(connectionPortInput);
    
    // connect button
    var connectionConnectButton = document.createElement('button');
    connectionConnectButton.innerHTML = "Connect";
    connectionContainer.appendChild(connectionConnectButton);
    container.appendChild(connectionContainer);
    
    // The search option area
    var tableContainer = document.createElement('fieldset');
    tableContainer.classList.add('dqm4hep-browser-table');
    var tableLegend = document.createElement('legend');
    tableLegend.innerHTML = "Search result";
    tableContainer.appendChild(tableLegend);
    
    var datatable = new dqm4hep.monitoring.DataTable({
      parent: tableContainer,
      headerLabels: ["Module", "Path", "Name", "Type"]
    });
    // 
    container.appendChild(tableContainer);

    var buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('dqm4hep-browser-buttons');
    var replaceButton = document.createElement('button');
    replaceButton.innerHTML = "Replace";
    buttonsContainer.appendChild(replaceButton);
    var appendButton = document.createElement('button');
    appendButton.innerHTML = "Append";
    buttonsContainer.appendChild(appendButton);
    var closeButton = document.createElement('button');
    closeButton.innerHTML = "Close";
    buttonsContainer.appendChild(closeButton);
    tableContainer.appendChild(buttonsContainer);
    
    var addRow = function(mod, path, name, type) {
      datatable.addRow([mod, path, name, type]);
    }
    
    addRow("BeamAnalysis", "/", "SpotXY", "TH2F");
    addRow("BeamAnalysis", "/", "TrigTime", "TH1F");
    addRow("BeamAnalysis", "/", "PartRate", "TH1F");
    addRow("SlowControl", "/Sensors", "Temperature", "TDynamicGraph");
    addRow("SlowControl", "/Sensors", "Pressure", "TDynamicGraph");
    addRow("BeamAnalysis", "/", "SpotXY", "TH2F");
    addRow("BeamAnalysis", "/", "TrigTime", "TH1F");
    addRow("BeamAnalysis", "/", "PartRate", "TH1F");
    addRow("SlowControl", "/Sensors", "Temperature", "TDynamicGraph");
    addRow("SlowControl", "/Sensors", "Pressure", "TDynamicGraph");
    addRow("BeamAnalysis", "/", "SpotXY", "TH2F");
    addRow("BeamAnalysis", "/", "TrigTime", "TH1F");
    addRow("BeamAnalysis", "/", "PartRate", "TH1F");
    // addRow("SlowControl", "/Sensors", "Temperature", "TDynamicGraph");
    // addRow("SlowControl", "/Sensors", "Pressure", "TDynamicGraph");
    // addRow("BeamAnalysis", "/", "PartRate", "TH1F");
    // addRow("SlowControl", "/Sensors", "Temperature", "TDynamicGraph");
    // addRow("SlowControl", "/Sensors", "Pressure", "TDynamicGraph");
    // addRow("BeamAnalysis", "/", "PartRate", "TH1F");
    // addRow("SlowControl", "/Sensors", "Temperature", "TDynamicGraph");
    // addRow("SlowControl", "/Sensors", "Pressure", "TDynamicGraph");
  };

  return dqm4hep;
});
