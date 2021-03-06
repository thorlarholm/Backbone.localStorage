/**
 * Backbone localStorage Adapter v1.0
 * https://github.com/jeromegn/Backbone.localStorage
 */

// A simple module to enhance `Backbone.sync` with *localStorage*-based
// persistence. Models are given GUIDS, and saved into a JSON object. Simple
// as that.

(function localStorageLogic(window, Backbone, undefined) {
  // Generate four random hex digits.
  function S4() {
     return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };

  // Generate a pseudo-GUID by concatenating random hexadecimal.
  function guid() {
     return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  };

  // Our Store is represented by a single JS object in *localStorage*. Create it
  // with a meaningful name, like the name you'd give a table.
  window.Store = function Store(name) {
    this.name = name;
    var store = window.localStorage.getItem(this.name);
    this.records = (store && store.split(",")) || [];
  };

  _.extend(Store.prototype, {

    // Save the current state of the **Store** to *localStorage*.
    save: function save() {
      window.localStorage.setItem(this.name, this.records.join(","));
    },

    // Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
    // have an id of it's own.
    create: function create(model) {
      if (!model.id) model.id = model.attributes.id = guid();
      window.localStorage.setItem(this.name+"-"+model.id, JSON.stringify(model));
      this.records.push(model.id.toString());
      this.save();
      return model;
    },

    // Update a model by replacing its copy in `this.data`.
    update: function update(model) {
      window.localStorage.setItem(this.name+"-"+model.id, JSON.stringify(model));
      if (!_.include(this.records, model.id.toString())) this.records.push(model.id.toString()); this.save();
      return model;
    },

    // Retrieve a model from `this.data` by id.
    find: function find(model) {
      return JSON.parse(window.localStorage.getItem(this.name+"-"+model.id));
    },

    // Return the array of all models currently in storage.
    findAll: function findAll() {
      return _.map(this.records, function mapRecord(id){return JSON.parse(window.localStorage.getItem(this.name+"-"+id));}, this);
    },

    // Delete a model from `this.data`, returning it.
    destroy: function destroy(model) {
      window.localStorage.removeItem(this.name+"-"+model.id);
      this.records = _.reject(this.records, function rejectRecord(record_id){return record_id == model.id.toString();});
      this.save();
      return model;
    }

  });

  // localSync delegate to the model or collection's
  // *localStorage* property, which should be an instance of `Store`.
  Backbone.localSync = function localSync(method, model, options, error) {

    // Backwards compatibility with Backbone <= 0.3.3
    if (typeof options == 'function') {
      options = {
        success: options,
        error: error
      };
    }

    var resp;
    var store = model.localStorage || model.collection.localStorage;

    // Fallback to ajaxSync for models and collections that are not using localStorage
    if (_.isFunction(store) === false) {
      return Backbone.ajaxSync.call(this, method, model, options, error);
    }

    switch (method) {
      case "read":    resp = model.id != undefined ? store.find(model) : store.findAll(); break;
      case "create":  resp = store.create(model);                            break;
      case "update":  resp = store.update(model);                            break;
      case "delete":  resp = store.destroy(model);                           break;
    }

    if (resp) {
      options.success(resp);
    } else {
      options.error("Record not found");
    }
  };

  // Override 'Backbone.sync' to default to localSync, 
  // the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
  Backbone.ajaxSync = Backbone.sync;
  Backbone.sync = Backbone.localSync;

})(window, Backbone);
