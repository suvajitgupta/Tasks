// Project: Tasks 
// ==========================================================================
/*globals Tasks CoreTasks sc_require*/
/** 

  Tasks editor overview view.
  
  @extends SC.View
  @author Suvajit Gupta
*/
sc_require('views/task_editor_helper');

Tasks.TaskEditorOverviewView = SC.View.extend(
/** @scope Tasks.TaskEditorOverviewView.prototype */ {
  
  layout: Tasks.isMobile? { top: 0, bottom: 0, left: 0, right: 0 } : { height: 165 },
  classNames: 'task-editor-overview'.w(),

  childViews: 'nameLabel nameField typeLabel typeField priorityLabel priorityField statusLabel statusField validationLabel validationField effortLabel effortField effortHelpLabel submitterLabel submitterField projectLabel projectField assigneeLabel assigneeField'.w(),
  
  nameLabel: SC.LabelView.design({
    layout: { top: 35, left: 0, height: 24, width: 55 },
    textAlign: SC.ALIGN_RIGHT,
    value: "_Name".loc()
  }),
  nameField: SC.TextFieldView.design({
    layout: { top: 33, left: 60, right: 10, height: 24 },
    isEnabledBinding: 'Tasks.tasksController.isEditable'
  }),

  typeLabel: SC.LabelView.design({
    layout: { top: 69, left: 0, height: 24, width: 55 },
    isVisibleBinding: 'Tasks.softwareMode',
    textAlign: SC.ALIGN_RIGHT,
    value: "_Type".loc()
  }),
  typeField: SC.SelectButtonView.design({
    layout: { top: 67, left: 60, height: 24, width: 120 },
    classNames: ['square'],
    localize: YES,
    isVisibleBinding: 'Tasks.softwareMode',
    isEnabledBinding: 'Tasks.tasksController.isEditable',
    objects: Tasks.taskEditorHelper.types(),
    nameKey: 'name',
    valueKey: 'value',
    iconKey: 'icon',
    toolTip: "_TypeTooltip".loc()
  }),

  priorityLabel: SC.LabelView.design({
    layout: { top: 69, left: 148, height: 24, width: 70 },
    textAlign: SC.ALIGN_RIGHT,
    value: "_Priority".loc()
  }),
  priorityField: SC.SelectButtonView.design({
    layout: { top: 67, left: 220, height: 24, width: 120 },
    classNames: ['square'],
    localize: YES,
    isEnabledBinding: 'Tasks.tasksController.isEditable',
    objects: Tasks.taskEditorHelper.priorities(),
    nameKey: 'name',
    valueKey: 'value',
    toolTip: "_PriorityTooltip".loc()
  }),

  statusLabel: SC.LabelView.design({
    layout: Tasks.isMobile? { top: 104, left: 0, height: 24, width: 55 } : { top: 69, right: 285, height: 24, width: 55 },
    textAlign: SC.ALIGN_RIGHT,
    value: "_Status".loc()
  }),
  statusField: SC.SelectButtonView.design({
    layout: Tasks.isMobile? { top: 102, left: 60, height: 24, width: 120 } : { top: 67, right: 190, height: 24, width: 120 },
    classNames: ['square'],
    localize: YES,
    isEnabledBinding: 'Tasks.tasksController.isEditable',
    objects: Tasks.taskEditorHelper.statuses(),
    nameKey: 'name',
    valueKey: 'value',
    toolTip: "_StatusTooltip".loc(),
    _valueDidChange: function() {
      this.parentView._statusDidChange();
    }.observes('value')
  }),

  validationLabel: SC.LabelView.design({
    layout: Tasks.isMobile? { top: 104, left: 148, height: 24, width: 70 } : { top: 69, right: 105, height: 24, width: 70 },
    textAlign: SC.ALIGN_RIGHT,
    isVisibleBinding: 'Tasks.softwareMode',
    value: "_Validation".loc()
  }),
  validationField: SC.SelectButtonView.design({
    layout: Tasks.isMobile? { top: 102, left: 220, height: 24, width: 120 } : { top: 67, right: 10, height: 24, width: 120 },
    classNames: ['square'],
    localize: YES,
    isVisibleBinding: 'Tasks.softwareMode',
    objects: Tasks.taskEditorHelper.validations(),
    nameKey: 'name',
    valueKey: 'value',
    toolTip: "_ValidationTooltip".loc()
  }),

  effortLabel: SC.LabelView.design({
    layout: { top: Tasks.isMobile? 137 : 102, left: 0, height: 24, width: 55 },
    textAlign: SC.ALIGN_RIGHT,
    value: "_Effort:".loc()
  }),
  effortField: SC.TextFieldView.design({
    layout: { top: Tasks.isMobile? 135 : 100, left: 60, width: 95, height: 24 },
    isEnabledBinding: 'Tasks.tasksController.isEditable'
  }),
  effortHelpLabel: SC.LabelView.design({
    layout: { top: 100, left: 160, height: 30, width: 235 },
    escapeHTML: NO,
    isVisible: !Tasks.isMobile,
    classNames: [ 'onscreen-help'],
    value: "_EffortOnscreenHelp".loc()
  }),

  projectLabel: SC.LabelView.design({
    layout: { top: Tasks.isMobile? 172 : 134, left: 0, height: 24, width: 55 },
    textAlign: SC.ALIGN_RIGHT,
    value: "_Project:".loc()
  }),
  projectField: SCUI.ComboBoxView.design({
    layout: { top: Tasks.isMobile? 170 : 132, left: 60, width: 252, height: 24 },
    objectsBinding: SC.Binding.oneWay('Tasks.taskEditorHelper*projects'),
    nameKey: 'displayName',
    valueKey: 'id',
    iconKey: 'icon',
    isEnabledBinding: 'Tasks.tasksController.isReallocatable'
  }),

  submitterLabel: SC.LabelView.design({
    layout: Tasks.isMobile? { top: 207, left: 0, height: 24, width: 55 } : { top: 102, right: 285, height: 24, width: 75 },
    textAlign: SC.ALIGN_RIGHT,
    value: "_Submitter:".loc()
  }),
  submitterField: SCUI.ComboBoxView.design({
    layout: Tasks.isMobile? { top: 205, left: 60, width: 252, height: 24 } : { top: 100, right: 10, width: 252, height: 24 },
    objectsBinding: SC.Binding.oneWay('Tasks.taskEditorHelper*users'),
    nameKey: 'displayName',
    valueKey: 'id',
    iconKey: 'icon',
    isEnabledBinding: 'Tasks.tasksController.isEditable'
  }),

  assigneeLabel: SC.LabelView.design({
    layout: Tasks.isMobile? { top: 242, left: 0, height: 24, width: 55 } : { top: 134, right: 285, height: 24, width: 75 },
    textAlign: SC.ALIGN_RIGHT,
    value: "_Assignee:".loc()
  }),
  assigneeField: SCUI.ComboBoxView.design({
    layout: Tasks.isMobile? { top: 240, left: 60, width: 252, height: 24 } : { top: 132, right: 10, width: 252, height: 24 },
    objectsBinding: SC.Binding.oneWay('Tasks.taskEditorHelper*nonGuestsList'),
    nameKey: 'displayName',
    valueKey: 'id',
    iconKey: 'icon',
    isEnabledBinding: 'Tasks.tasksController.isEditable'
  }),
  
  _statusDidChange: function() {
    var status = this.getPath('statusField.value');
    var isDone = (status === CoreTasks.STATUS_DONE);
    this.setPath('validationField.isEnabled', isDone);
    if(!isDone) this.setPath('validationField.value', CoreTasks.TASK_VALIDATION_UNTESTED);
  }
  
});
