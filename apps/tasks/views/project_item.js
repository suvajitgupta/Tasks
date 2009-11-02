// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks sc_require*/
sc_require('mixins/localized_label');

/** 

  Used as exampleView for project information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.ProjectItemView = SC.ListItemView.extend(Tasks.LocalizedLabel,
/** @scope Tasks.ProjectItemView.prototype */ {
  
  /** @private
    If mouse was down over Description Icon open the editor.
  */  
  mouseDown: function(event) {
    var classes = event.target.className;
    if (classes.match('project-icon-no-tasks') || classes.match('project-icon-has-tasks') ||
        classes.match('count') || classes.match('inner')) {
      var layer = this.get('layer');
      var that = this;
      this._editorPane = SC.PickerPane.create({
        
        layout: { width: 500, height: 200 },
        
        // Avoid popup panel coming up on other items while it is up already
        poppedUp: false,
        popup: function() {
          if(this.poppedUp) return;
          this.poppedUp = true;
          sc_super();
        },
        remove: function() {
          this.poppedUp = false;
          sc_super();
        },
        
        didBecomeKeyPaneFrom: function(pane) {
          sc_super();
          var content = that.get('content');
          content.beginEditing();
          content.beginPropertyChanges();
        },
        didLoseKeyPaneTo: function(pane) {
          sc_super();
          var content = that.get('content');
          content.endEditing();
          content.endPropertyChanges();
        },
        
        contentView: SC.View.design({
          layout: { left: 0, right: 0, top: 0, bottom: 0},
          childViews: [
          
            SC.LabelView.design({
              layout: { top: 10, left: 10, height: 17, width: 100 },
              value: "_TimeLeft:".loc()
            }),
            SC.TextFieldView.design({
              layout: { top: 10, left: 75, width: 80, height: 16 },
              valueBinding: SC.binding('.content.timeLeftValue', this)
            }),
            SC.LabelView.design({
              layout: { top: 10, left: 160, height: 50, right: 10 },
              escapeHTML: NO,
              classNames: [ 'onscreen-help'],
              value: "_TimeLeftOnscreenHelp".loc()
            }),
            
            SC.LabelView.design({
              layout: { top: 40, left: 10, height: 17, width: 100 },
              value: "_Description:".loc()
            }),
            SC.TextFieldView.design({
              layout: { top: 65, left: 10, right: 10, bottom: 10 },
              hint: "_DescriptionHint".loc(),
              isTextArea: YES,
              valueBinding: SC.binding('.content.description', this)
            })
            
          ]
        })
      });
      this._editorPane.popup(layer, SC.PICKER_POINTER);
    }
    return NO;
  },
  
  inlineEditorWillBeginEditing: function(inlineEditor) {
    var projectName = inlineEditor.value;
    if (projectName === CoreTasks.ALL_TASKS_NAME.loc() || projectName === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) inlineEditor.discardEditing();
  },
  
  render: function(context, firstTime) {
    var content = this.get('content');
    if(content) {
      var projectName = content.get('name');
      context.addClass('project-item');
      if (projectName === CoreTasks.ALL_TASKS_NAME.loc() || projectName === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) context.addClass('reserved-project-item');
      else context.addClass('regular-project-item');

      var tasks = content.get('tasks');
      if(tasks) {
        var projectTooltip = "_Has".loc() + tasks.get('length') + "_Tasks".loc();
        if(content.get('displayTimeLeft')) projectTooltip += ('; ' + "_ProjectTimeLeftTooltip".loc());
        context.attr('title', projectTooltip);
        context.attr('alt', projectTooltip);
      }
    }
    sc_super();
  }
  
});
