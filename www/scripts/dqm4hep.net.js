/**
 * @summary Javascript dqm4hep net classes
 * @author Remi Ete
 * @copyright 2018
 * @since 24.06.2018
 */

(function (factory) {
  if(typeof dqm4hep != 'undefined' && typeof dqm4hep.net != 'undefined') {
    throw new Error('DQM4hep net script already loaded !', 'dqm4hep.net.js');
  }
  else if(typeof dqm4hep != 'undefined' && typeof dqm4hep.net == 'undefined') {
    factory(dqm4hep);
  }
  else if(typeof dqm4hep == 'undefined') {
    dqm4hep = {}
    factory(dqm4hep);
  }
})(function(dqm4hep) {
   // sub-namespace for net classes
   dqm4hep.net = {};
   
   /**
    * Main client classes to chat with a dqm4hep websocket server
    * @param {object} config The client configuration
    */
   dqm4hep.net.Client = function(config) {
     var self = this;
     var port = typeof config.port == 'number' ? config.port : 8090;
     var host = typeof config.host == 'string' ? config.host : "localhost";
     var timeout = 2000; // 2 seconds
     var uidgen = new dqm4hep.core.UID();
     var services = {};
     var requests = {};
     var commands = {};
     
     /**
      * Subscribe to a service
      * @param  {string}   name     the service name to subscribe
      * @param  {Function} callback the callback function to receive data
      * @return {number}            a unique service id
      */
     this.subscribe = function(name, callback) {
       var serviceData = services[name];
       var uid = uidgen.getUID();
       if(serviceData === undefined) {
         var wsname = "ws://" + host + ":" + port.toString();
         if(!name.startsWith("/")) {
           wsname += "/";
         }
         wsname += name;
         var websocket = new ReconnectingWebSocket(wsname);
         serviceData = {
           websocket: websocket,
           callbacks: [
             { uid: uid, callback: callback }
           ]
         };        
         websocket.onopen = function() {
           this.send("subscribe");
         };
         websocket.onmessage = function(evt) {
           var serviceData = services[name];
           for(var index = 0 ; index<serviceData.callbacks.length ; index++) {
             serviceData.callbacks[index].callback(evt.data);
           }
         };
         services[name] = serviceData;
       }
       else {
         serviceData.callbacks.push({
           uid: uid,
           callback: callback
         });
       }
       return uid;
     };
     
     /**
      * Unsubscribe from a service
      * @param  {number} uid the service uid to unsubscribe
      */
     this.unsubscribe = function(uid) {
       services.keys().every(function(key, index) {
         var service = services[index];
         return service.callbacks.every(function(element, index2) {
           if(element.uid == uid) {
             service.callbacks.splice(index2, 1);
             uidgen.reUse(uid);
             if(service.callbacks.length == 0) {
               service.websocket.close();
               delete services[index];
             }
             return false;
           }
           return true;
         });
       });
     }
     
     /**
      * Send a command to server
      * @param  {string} name the command name
      * @param  {string} data the data to send
      * @return {number}      the command uid
      */
     this.sendCommand = function(name, data) {
       var wsname = "ws://" + host + ":" + port.toString();
       if(!name.startsWith("/")) {
         wsname += "/";
       }
       wsname += name;
       if(typeof data == 'number') {
         data = data.toString();
       }
       else if(typeof data == 'object') {
         data = JSON.stringify(data);
       }
       else if(typeof data != 'string') {
         data = "";
       }
       var websocket = new ReconnectingWebSocket(wsname);
       var uid = uidgen.getUID();
       commands[uid] = websocket;
       var sent = false;
       websocket.onopen = function() {
         this.send(data);
         sent = true;
         this.close();
         delete commands[uid];
         uidgen.reUse(uid);
       };
       setTimeout(function() {
         if(sent) {
           return;
         }
         websocket.close();
         delete commands[uid];
         uidgen.reUse(uid);
       }, timeout);
       return uid;
     };
     
     /**
      * Send a request to server
      * @param  {string}   name     the request name
      * @param  {string}   data     the request data to send
      * @param  {Function} callback the callback function to receive the server response
      * @param  {string}   fallback the default value, in case of no response from the server 
      * @return {number}            the request uid
      */
     this.sendRequest = function(name, data, callback, fallback) {
       var wsname = "ws://" + host + ":" + port.toString();
       if(!name.startsWith("/")) {
         wsname += "/";
       }
       wsname += name;
       if(typeof data == 'number') {
         data = data.toString();
       }
       else if(typeof data == 'object') {
         data = JSON.stringify(data);
       }
       else if(typeof data != 'string') {
         data = "";
       }
       var websocket = new ReconnectingWebSocket(wsname);
       var uid = uidgen.getUID();
       var received = false;
       requests[uid] = {
         websocket: websocket,
         callback: callback
       };
       websocket.onopen = function() {
         this.send(data);
       };
       websocket.onmessage = function(evt) {
         received = true;
         this.close();
         callback(evt.data);
         delete requests[uid];
         uidgen.reUse(uid);
       };
       setTimeout(function() {
         if(received) {
           return;
         }
         websocket.close();
         callback(fallback);
         delete requests[uid];
         uidgen.reUse(uid);
       }, timeout);
       return uid;
     };
     
     /**
      * Clear all cache commands that have not been sent yet to server
      */
     this.clearCachedCommands = function() {
       commands.keys().forEach(function(key, index) {
         commands[key].close();
         delete commands[key];
         uidgen.reUse(key);
       });
       commands = {};
     };
     
     /**
      * Clear all cache requests that have not been sent yet to server
      */
     this.clearCachedRequests = function() {
       requests.keys().forEach(function(key, index) {
         requests[key].websocket.close();
         delete requests[key];
         uidgen.reUse(key);
       });
       requests = {};
     };
     
     /**
      * Clear all cache commands and requests that have not been sent yet to server
      */
     this.clearCache = function() {
       this.clearCachedCommands();
       this.clearCachedRequests();
     };
   };
   return dqm4hep;
});