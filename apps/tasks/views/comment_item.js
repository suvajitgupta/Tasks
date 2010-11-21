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

Tasks.CommentItemView = SC.View.extend(SC.StaticLayout, SC.Control,
/** @scope Tasks.CommentItemView.prototype */ {
  
  displayProperties: 'showHover'.w(),
  showHover: SC.platform.touch,
  
  /** @private
    Add explicit hover class - using this to avoid problems on iPad.
  */  
  mouseEntered: function(event) {
    this.set('showHover', YES);
    return YES;
  },

  /** @private
    Remove explicit hover class - using this to avoid problems on iPad.
  */  
  mouseExited: function(event) {
    this.set('showHover', NO);
    return YES;
  },

  useStaticLayout: YES,
  childViews: 'commentHeaderLabel editButton deleteButton descriptionLabel'.w(),
  
  commentHeaderLabel: SC.LabelView.design({
    layout: { left: 0, right: 0, top: 0, height: 17 },
    classNames: [ 'comment-header'],
    icon: 'comment-icon',
    escapeHTML: NO
  }),
  
  editButton: SC.View.design(SCUI.SimpleButton, {
    layout: { right: 35, width: 16, top: 2, height: 16 },
    classNames: ['edit-comment-icon'],
    toolTip: "_EditComment".loc(),
    mouseDown: function() {
      var description = this.getPath('parentView.descriptionLabel');
      description.beginEditing();
    }
  }),
  
  deleteButton: SC.View.design(SCUI.SimpleButton, {
    layout: { right: 5, width: 16, top: 2, height: 16 },
    classNames: ['delete-comment-icon'],
    toolTip: "_DeleteComment".loc(),
    mouseDown: function() {
      var comment = this.getPath('parentView.content');
      comment.destroy();
    }
  }),
  
  descriptionLabel: SC.LabelView.design(SC.StaticLayout, {
    useStaticLayout: YES,
    classNames: [ 'comment-description'],
    tagName: 'pre',
    isInlineEditorMultiline: YES,
    escapeHTML: NO,
    inlineEditorDidEndEditing: function(inlineEditor, finalValue) {
      sc_super();
      var comment = this.getPath('parentView.content');
      comment.setIfChanged('description', finalValue);
    }
  }),
  
  contentPropertyDidChange: function(target, key) {
    if (this.owner && this.owner.updateHeight) this.owner.updateHeight();
  },
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
    // console.log('DEBUG: Comment render(' + firstTime + '): ' + content.get('description'));
    if(!content) return;
    
    var isCurrentUserComment = content.get('userId') === CoreTasks.getPath('currentUser.id');
    var showHover = this.get('showHover');
    this.setPath('editButton.isVisible', showHover && isCurrentUserComment);
    this.setPath('deleteButton.isVisible', showHover && isCurrentUserComment);
    this.setPath('descriptionLabel.isEditable', isCurrentUserComment);
    
    var user = CoreTasks.store.find(CoreTasks.User, content.get('userId'));
    var commentHeader = '';
    if(user) commentHeader += (user.get('displayName') + '&nbsp;');
    var createdAt = content.get('createdAt');
    if(createdAt) commentHeader += ('<span class="date-time">' + "_commented".loc() + Tasks.getTimeAgo(createdAt) + '</span>');
    this.setPath('commentHeaderLabel.value', commentHeader);
    this.setPath('descriptionLabel.value', content.get('description'));//.replace(/\n/g, '<br>'));
    this.renderChildViews(context, firstTime);
    
  }

});