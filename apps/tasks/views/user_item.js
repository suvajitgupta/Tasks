// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks sc_require*/
sc_require('mixins/localized_label');

/** 

  Used as exampleView for user information display in the User Manager.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.UserItemView = SC.ListItemView.extend(Tasks.LocalizedLabel,
/** @scope Tasks.UserItemView.prototype */ {
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
    if(!content) return;
    // console.log('DEBUG-ON: User render(' + firstTime + '): ' + content.get('displayName'));
    sc_super();
    
    // Put a dot before users that were created or updated recently
    if(content.get('isRecentlyUpdated')) {
      context = context.begin('img').addClass('recently-updated').attr({
        src: SC.BLANK_IMAGE_URL,
        title: "_RecentlyUpdatedTooltip".loc(),
        alt: "_RecentlyUpdatedTooltip".loc()
      }).end();
    }
    
    context.addClass('user-item');
    
  }
  
});
