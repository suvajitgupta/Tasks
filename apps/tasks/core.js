// ==========================================================================
// Project:   Tasks
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/**

  "Tasks" - an agile project management tool
  
  @extends SC.Object
  @author Suvajit Gupta
  @version 0.1
*/
/*globals Tasks CoreTasks */

Tasks = SC.Object.create(
  /** @scope Tasks.prototype */ {

  NAMESPACE: 'Tasks',
  VERSION: '1.5',
  isLoaded: NO, // for Lebowski
  
  /*
   * Tasks server types
   */
  NO_SERVER: 0x0000,
  PERSEVERE_SERVER: 0x0001,
  GAE_SERVER: 0x0002,
  serverType: 0x0002,
  
  /**
   * A computed property to indicate whether the server is capable of sending notifications.
   * @returns {Boolean} true: if connected to a server that supports notifications, false otherwise
   */
  canServerSendNotifications: function() {
    if(CoreTasks.get('dataSource') === CoreTasks.FIXTURES_DATA_SOURCE) return true; // to assist with testing via fixtures
    return this.get('serverType') === this.GAE_SERVER;
  }.property('serverType').cacheable(),
  
  getBaseUrl: function() {
    return window.location.protocol + '//' + window.location.host + window.location.pathname;
  },
  
  getHelpUrl: function() {
    return static_url('help.html') + '?softwareMode=' + Tasks.softwareMode;
  },
  
  nameAlphaSort: function(a,b) {
    var aName = a.get('name');
    var bName = b.get('name');
    if(aName === bName) return 0;
    else return aName > bName? 1 : -1;
  },
  
  getTimeAgo: function(then) {
    var time, now = SC.DateTime.create();
    var minutes = (now.get('milliseconds') - then.get('milliseconds')) / 60000;
    if(Math.round(minutes) <= 1) time = "_justNow".loc();
    else if(minutes < 60) time = (Math.round(minutes) + "_minutesAgo".loc());
    else {
      var hours = minutes / 60;
      if(hours < 2) time = "_oneHourAgo".loc();
      else if(hours < 24) time = (Math.round(hours) + "_hoursAgo".loc());
      else {
        var days = hours / 24;
        if(days < 2) time = "_yesterday".loc();
        else if (days < 30) time = (Math.round(days) + "_daysAgo".loc());
        else time = then.toFormattedString(CoreTasks.DATE_FORMAT);
      }
    }
    return time;
  }
    
});


/**
  Some view overrides to turn off escapeHTML for menu items in context menus and select buttons.
*/
SC.MenuItemView = SC.MenuItemView.extend({
  escapeHTML: NO
});

SC.SelectButtonView = SC.SelectButtonView.extend({
  escapeHTML: NO
});

SCUI.ContextMenuPane = SCUI.ContextMenuPane.extend({
  exampleView: SC.MenuItemView
});

// TODO: [SG/JL] remove hack for SCUI ComboBoxView using an SC.ButtonView since it doesn't fit unless all SC styles are overridden
SCUI.ComboBoxView.prototype.dropDownButtonView = SC.View.extend( SCUI.SimpleButton, {
  classNames: 'scui-combobox-dropdown-button-view',
  layout: { top: 0, right: 0, height: 24, width: 28 }
});

// TODO: [SG/EG] update SCUI.ToolTip to work with SC master (new rendering subsystem), CheckboxView still not working

// TODO: [SG/BB] make SCUI.ModalPane close button target/action overridable without snippet below
SCUI.ModalPane = SCUI.ModalPane.extend({
  initMixin: function() {
    var headerCloseButton = this.childViews[0].closeButton;
    headerCloseButton.set('target', null);
    headerCloseButton.set('action', 'close');
  }
});

/**
  A Standard Binding transform to localize a string in a binding.
*/
SC.Binding.toLocale = function() {
  return this.transform(function(value, binding) {
    var returnValue = '';
    if (SC.typeOf(value) === SC.T_STRING) {
      returnValue = "%@".fmt(value).loc();
    }
    return returnValue;
  });
};

// if software mode set to false, works as a simple To Do list (Task Type/Validation are not available through GUI)
Tasks.softwareMode = document.title.match(/todo/i)? false: true;