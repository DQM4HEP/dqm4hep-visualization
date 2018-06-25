/**
 * @summary Javascript dqm4hep core classes
 * @author Remi Ete
 * @copyright 2018
 * @since 24.06.2018
 */

(function (factory) {
  if(typeof dqm4hep != 'undefined' && typeof dqm4hep.core != 'undefined') {
    throw new Error('DQM4hep core script already loaded !', 'dqm4hep.core.js');
  }
  else if(typeof dqm4hep != 'undefined' && typeof dqm4hep.core == 'undefined') {
    factory(dqm4hep);
  }
  else if(typeof dqm4hep == 'undefined') {
    dqm4hep = {}
    factory(dqm4hep);
  }
})(function(dqm4hep) {
  // sub-namespace for core classes
  dqm4hep.core = {};
  
  /**
  * Utility class to generate a unique identifier.
  * Generated identifiers can be recycled when
  * user no longer needs it using the reUse() function
  */
  dqm4hep.core.UID = function() {
    var id = 0;
    var reuseids = [];

    /**
     * Generate unique identifier
     * @return {number} a unique identifier
     */
    this.getUID = function() {
      if(reuseids.length > 0) {
        return reuseids.shift();
      }
      return id++;
    };

   /**
    * Re use an already generated identifier
    * @param  {number} rid the identifier to reuse
    */
    this.reUse = function(rid) {
      if(rid < 0 || id <= rid || typeof rid != 'number' || reuseids.indexOf(rid) >= 0) {
        return;
      }
      reuseids.push(rid);
    }
  };
  
  /**
   * MonitorElement class
   * @param {object} object monitor element description
   */
  dqm4hep.core.MonitorElement = function(object) {
    this.object = null;
    this.reference = null;
    this.path = "";
    this.module = "";
    this.collector = "";
    this.runNumber = 0;
    this.description = "";
    this.reports = {};
    
    var updateEvent = new Event('update');
    updateEvent.element = this;
    var element = document.createElement("div");
    
    this.addEventListener = function(type, listener, options) {
      element.addEventListener(type, listener, options);
    };
  
    this.removeEventListener = function(type, listener, options) {
      element.removeEventListener(type, listener, options);
    };
    
    this.update = function(object, emit) {
      this.object = typeof object.object == 'undefined' ? null : object.object;
      this.path = typeof object.path == 'undefined' ? "" : object.path;
      this.module = typeof object.module == 'undefined' ? "" : object.module;
      this.collector = typeof object.collector == 'undefined' ? "" : object.collector;
      this.runNumber = typeof object.runNumber == 'undefined' ? 0 : object.runNumber;
      this.description = typeof object.description == 'undefined' ? "" : object.description;
      this.reports = typeof object.reports == 'undefined' ? {} : object.reports;
      if(typeof emit == 'bool' && emit) {
        element.dispatchEvent(updateEvent);
      }
    }
    
    this.propertiesEquals = function(other) {
      if(other === undefined || other === null) {
        return false;
      }
      if(other.path != this.path) {
        return false;
      }
      var name = typeof this.object != 'undefined' ? this.object.fName : "";
      var oname = typeof other.object != 'undefined' ? other.object.fName : "";
      if(name != oname) {
        return false;
      }
      if(other.name != this.name) {
        return false;
      }
      if(other.module != this.module) {
        return false;
      }
      if(other.collector != this.collector) {
        return false;
      }
      return true;
    }
  
    this.update(object, false);
  };
  
  return dqm4hep;
});