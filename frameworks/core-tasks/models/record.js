/*globals CoreTasks sc_require */
sc_require('models/record_attribute');

CoreTasks.MILLISECONDS_IN_DAY = 24*60*60*1000;

// Development status:
CoreTasks.STATUS_PLANNED = '_Planned'; // default
CoreTasks.STATUS_ACTIVE = '_Active';
CoreTasks.STATUS_DONE = '_Done';
CoreTasks.STATUS_RISKY = '_Risky';

/**
 * The base record from which all models in the CoreTasks framework will derive.
 *
 * @extends SC.Record
 * @author Suvajit Gupta
 * @author Sean Eidemiller
 */
CoreTasks.Record = SC.Record.extend({

  /**
   * The primary key for all Tasks records is the "id" attribute.
   */
  primaryKey: 'id',

  /**
   * An initial ID assigned by the client and echoed back by the server.
   *
   * This is needed so that the client is able to recognize a persisted record after it's ID has
   * been properly set by the server.
   */
  _id: SC.Record.attr(Number),

  // make id() cacheable on storeKey
  id: function() {
    return parseInt(SC.Store.idFor(this.storeKey), 10);
  }.property('storeKey'),

  // make status() cacheable on storeKey
  status: function() {
    return this.store.readStatus(this.storeKey);
  }.property('storeKey'),
  
  /**
   * A displayable version of id.
   */
  displayId: function() {
    var id = this.get('id');
    // console.log(id + ' ' + this.get('name'));
    // TODO: [SC] remove hack once SC.Query is able to parse negative numbers
    // if (id < 0) id = '-----';
    if (id >= CoreTasks.MAX_RECORD_ID) id = '-----';
    return '#' + id;
  }.property('id'),

  /**
   * A one-line summary of the record.
   */
  name: SC.Record.attr(String),

  /**
   * Multi-line comments about the record.
   */
  description: SC.Record.attr(String),

  /**
   * Time at which the record was created.
   *
   * Expressed in milliseconds since the Unix Epoch.
   */
  createdAt: SC.Record.attr('CoreTasks.Date'),
  displayCreatedAt: function() {
    var time = this.get('createdAt');
    return time? ("_Created:".loc() + time.toFormattedString(CoreTasks.TIME_DATE_FORMAT)) : '';
  }.property('createdAt'),

  /**
   * Time at which the record was last updated.
   *
   * Expressed in milliseconds since the Unix Epoch.
   */
  updatedAt: SC.Record.attr('CoreTasks.Date'),
  displayUpdatedAt: function() {
    var time = this.get('updatedAt');
    return time? ("_Updated:".loc() + time.toFormattedString(CoreTasks.TIME_DATE_FORMAT)) : '';
  }.property('updatedAt'),

  /**
   * Check if record was updated recently.
   */
  isRecentlyUpdated: function() {
    var ageInDays = null;
    var now = SC.DateTime.create().get('milliseconds'), then;
    var updatedAt = this.get('updatedAt');
    if(updatedAt) {
      then = updatedAt.get('milliseconds');
      ageInDays = (now - then)/CoreTasks.MILLISECONDS_IN_DAY;
    }
    return (ageInDays === null || ageInDays > 1)? false : true;
  }.property('createdAt', 'updatedAt').cacheable(),

  /*
   * The state of the record immediately prior to persistence, used as revert state if there's an
   * error.
   */
  _revertToState: null,

  /**
   * Reverts the record to a non-error state.
   */
  revertState: function() {
    
    if (this.get('status') !== SC.Record.ERROR || SC.none(this._revertToState)) return false;

    var store = this.get('store');
    var key = this.get('storeKey');
    SC.RunLoop.begin();
    store.writeStatus(key, this._revertToState);
    store.dataHashDidChange(key);
    this._revertToState = null;
    SC.RunLoop.end();
    return true;
    
  },

  commit: function() {
    // Store the revert-to state and commit.
    this._revertToState = this.store.peekStatus(this.get('storeKey'));
    return this.commitRecord();
  },

  destroy: function() {
    // Store the revert-to state and destroy.
    this._revertToState = SC.Record.DESTROYED_DIRTY;
    return sc_super();
  }

});

// Define and register the CoreTasks.Date transformer, which converts a Javascript Number primitive
// (representing the number of milliseconds since the Unix Epoch) to an SC.DateTime object.
CoreTasks.Date = SC.beget(Object);

SC.RecordAttribute.registerTransform(CoreTasks.Date, {

  /**
   * Converts the given number of milliseconds since the Unix Epoch to an SC.DateTime object.
   */
  to: function(value) {
    if (SC.typeOf(value) === SC.T_NUMBER) value = SC.DateTime.create(value);
    return value;
  },

  /**
   * Converts the given SC.DateTime object to the number of milliseconds since the Unix Epoch.
   */
  from: function(value) {
    if (SC.instanceOf(value, SC.DateTime)) value = value.get('milliseconds');
    return value;
  }
});
