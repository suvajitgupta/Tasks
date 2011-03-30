// Project: Tasks 
// ==========================================================================
/*globals Tasks CoreTasks sc_require*/
/** 

  Tasks editor description view.
  
  @extends SC.View
  @author Suvajit Gupta
*/
Tasks.TaskEditorDescriptionView = SC.View.extend(
/** @scope Tasks.TaskEditorDescriptionView.prototype */ {
  
  layout: Tasks.isMobile? { top: 20, bottom: 10, left: 10, right: 10 } : { top: 0, bottom: 0, left: 0, right: 0 },
  childViews: 'descriptionLabel descriptionField'.w(),
  
    descriptionLabel: SC.LabelView.design({
    layout: { top: 0, left: 0, height: 17, width: 100 },
    icon: 'description-icon',
    value: "_Description:".loc()
  }),
  descriptionField: SC.TextFieldView.design({
    layout: { top: 20, left: 2, right: 2, bottom: 5 },
    hint: "_DescriptionHint".loc(),
    maxLength: 500000,
    isTextArea: YES,
    isEnabled: YES,
    isEnabledBinding: 'Tasks.tasksController.isEditable'
  })
  
});

if(Tasks.isMobile) Tasks.taskEditorDescriptionView = Tasks.TaskEditorDescriptionView.create();