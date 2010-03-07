// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks sc_require SCUI*/
sc_require('mixins/localized_label');

/** 

  Used as exampleView for user information display in the User Manager.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.UserItemView = SC.ListItemView.extend(Tasks.LocalizedLabel,
/** @scope Tasks.UserItemView.prototype */ {
  
  mouseDown: function(event) {
    
    // console.log('DEBUG: mouse down on user item: ' + this.getPath('content.name'));

    var that = this;
    var content = this.get('content');
    if(!content.get('id')) return sc_super();

    var items = this._buildContextMenu();
    if(items.length > 0) {
      var pane = SCUI.ContextMenuPane.create({
        contentView: SC.View.design({}),
        layout: { width: 150, height: 0 },
        itemTitleKey: 'title',
        itemIconKey: 'icon',
        itemIsEnabledKey: 'isEnabled',
        itemTargetKey: 'target',
        itemActionKey: 'action',
        itemSeparatorKey: 'isSeparator',
        items: items
      });
      pane.popup(this, event); // pass in the mouse event so the pane can figure out where to put itself
    }
    return NO;
  },
  
  _buildContextMenu: function() {
    
    var ret = [];
    
    if(CoreTasks.getPath('permissions.canCreateUser')) {
      ret.push({
        title: "_Add".loc(),
        icon: 'add-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'addUser'
      });
    }
    
    if(CoreTasks.getPath('permissions.canDeleteUser')) {
      ret.push({
        title: "_Delete".loc(),
        icon: 'delete-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'deleteUser'
      });
    }
    
    return ret;
    
  },

  render: function(context, firstTime) {
    
    var content = this.get('content');
    if(!content) return;
    // console.log('DEBUG: User render(' + firstTime + '): ' + content.get('displayName'));
    sc_super();
    
    // Put a dot before users that were created or updated recently
    if(content.get('isRecentlyUpdated')) {
      context = context.begin('img').addClass('recently-updated').attr({
        src: SC.BLANK_IMAGE_URL,
        title: "_RecentlyUpdatedTooltip".loc(),
        alt: "_RecentlyUpdatedTooltip".loc()
      }).end();
    }
    
    if(content.get('id')) context.addClass('user-item');
    
  }
  
});
