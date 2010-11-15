// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks sc_require SCUI sc_static */
sc_require('mixins/localized_label');

/** 

  Used as exampleView for project information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.CommentItemView = SC.ListItemView.extend(
/** @scope Tasks.CommentItemView.prototype */ {
  
  childViews: 'commentHeaderLabel deleteButton descriptionLabel'.w(),
  
  commentHeaderLabel: SC.LabelView.design({
    layout: { left: 0, right: 0, top: 0, height: 17 },
    classNames: [ 'comment-header'],
    icon: 'comment-icon',
    escapeHTML: NO
  }),
  
  deleteButton: SC.View.design(SCUI.SimpleButton, {
    layout: { right: 0, width: 16, top: 2, height: 16 },
    classNames: ['delete-comment-icon'],
    toolTip: "_DeleteComment".loc(),
    mouseDown: function() {
      var comment = this.getPath('parentView.content');
      comment.destroy();
    }
  }),
  
  descriptionLabel: SC.LabelView.design({
    layout: { left: 0, right: 0, top: 20, bottom: 10 },
    classNames: [ 'comment-description'],
    isInlineEditorMultiline: YES,
    escapeHTML: NO,
    inlineEditorDidEndEditing: function(inlineEditor, finalValue) {
      sc_super();
      var comment = this.getPath('parentView.content');
      comment.setIfChanged('description', finalValue);
    }
  }),
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
    // console.log('DEBUG: Comment render(' + firstTime + '): ' + content.get('description'));
    if(!content) return;
    
    var isCurrentUserComment = content.get('userId') === CoreTasks.getPath('currentUser.id');
    this.setPath('deleteButton.isVisible', isCurrentUserComment);
    this.setPath('descriptionLabel.isEditable', isCurrentUserComment);
    
    var user = CoreTasks.store.find(CoreTasks.User, content.get('userId'));
    var commentHeader = '';
    if(user) commentHeader += (user.get('displayName') + '&nbsp;');
    var createdAt = content.get('createdAt');
    if(createdAt) commentHeader += ('<span class="date-time">' + createdAt.toFormattedString(CoreTasks.TIME_DATE_FORMAT) + '</span>');
    this.setPath('commentHeaderLabel.value', commentHeader);
    this.setPath('descriptionLabel.value', content.get('description'));//.replace(/\n/g, '<br>'));
    this.renderChildViews(context, firstTime);
    
  }

});