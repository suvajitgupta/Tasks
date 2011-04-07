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
  
  layout: Tasks.isMobile? { top: 35, bottom: 0, left: 0, right: 0 } : { top: 30, height: 165 },
  classNames: 'task-editor-overview'.w(),

  childViews: ((Tasks.isMobile? '' : 'effortHelpLabel ') + 'nameLabel nameField typeLabel typeField priorityLabel priorityField statusLabel statusField validationLabel validationField effortLabel effortField submitterLabel submitterField projectLabel projectField assigneeLabel assigneeField').w(),
  
  nameLabel: SC.LabelView.design({
    layout: { top: 5, left: 0, height: 24, width: 55 },
    textAlign: SC.ALIGN_RIGHT,
    value: "_Name".loc()
  }),
  nameField: SC.TextFieldView.design({
    layout: { top: 3, left: 60, right: Tasks.isMobile? 5 : 10, height: 24 },
    isEnabledBinding: 'Tasks.tasksController.isEditable'
  }),

  typeLabel: SC.LabelView.design({
    layout: { top: 39, left: 0, height: 24, width: 55 },
    isVisibleBinding: 'Tasks.softwareMode',
    textAlign: SC.ALIGN_RIGHT,
    value: "_Type".loc()
  }),
  typeField: SC.SelectButtonView.design({
    layout: { top: 37, left: 60, height: 24, width: 120 },
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
    layout: Tasks.isMobile && !Tasks.softwareMode? { top: 39, left: 0, height: 24, width: 55 } : { top: 39, left: 148, height: 24, width: 70 },
    textAlign: SC.ALIGN_RIGHT,
    value: "_Priority".loc()
  }),
  priorityField: SC.SelectButtonView.design({
    layout: Tasks.isMobile && !Tasks.softwareMode? { top: 37, left: 60, height: 24, width: 120 } : { top: 37, left: 220, height: 24, width: 120 },
    classNames: ['square'],
    localize: YES,
    isEnabledBinding: 'Tasks.tasksController.isEditable',
    objects: Tasks.taskEditorHelper.priorities(),
    nameKey: 'name',
    valueKey: 'value',
    toolTip: "_PriorityTooltip".loc()
  }),

  statusLabel: SC.LabelView.design({
    layout: Tasks.isMobile? { top: 74, left: 0, height: 24, width: 55 } : { top: 39, right: 275, height: 24, width: 55 },
    textAlign: SC.ALIGN_RIGHT,
    value: "_Status".loc()
  }),
  statusField: SC.SelectButtonView.design({
    layout: Tasks.isMobile? { top: 72, left: 60, height: 24, width: 120 } : { top: 37, right: 180, height: 24, width: 120 },
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
    layout: Tasks.isMobile? { top: 74, left: 148, height: 24, width: 70 } : { top: 39, right: 105, height: 24, width: 70 },
    textAlign: SC.ALIGN_RIGHT,
    isVisibleBinding: 'Tasks.softwareMode',
    value: "_Validation".loc()
  }),
  validationField: SC.SelectButtonView.design({
    layout: Tasks.isMobile? { top: 72, left: 220, height: 24, width: 120 } : { top: 37, right: 10, height: 24, width: 120 },
    classNames: ['square'],
    localize: YES,
    isVisibleBinding: 'Tasks.softwareMode',
    objects: Tasks.taskEditorHelper.validations(),
    nameKey: 'name',
    valueKey: 'value',
    toolTip: "_ValidationTooltip".loc()
  }),

  effortLabel: SC.LabelView.design({
    layout: { top: Tasks.isMobile? 107 : 72, left: 0, height: 24, width: 55 },
    textAlign: SC.ALIGN_RIGHT,
    value: "_Effort:".loc()
  }),
  effortField: SC.TextFieldView.design({
    layout: { top: Tasks.isMobile? 105 : 70, left: 60, width: 95, height: 24 },
    isEnabledBinding: 'Tasks.tasksController.isEditable'
  }),
  effortHelpLabel: Tasks.isMobile? null : SC.LabelView.design({
    layout: { top: 70, left: 160, height: 30, width: 235 },
    escapeHTML: NO,
    classNames: [ 'onscreen-help'],
    value: "_EffortOnscreenHelp".loc()
  }),

  projectLabel: SC.LabelView.design({
    layout: { top: Tasks.isMobile? 142 : 104, left: 0, height: 24, width: 55 },
    textAlign: SC.ALIGN_RIGHT,
    value: "_Project:".loc()
  }),
  projectField: SCUI.ComboBoxView.design({
    layout: { top: Tasks.isMobile? 140 : 102, left: 60, width: 252, height: 24 },
    objectsBinding: SC.Binding.oneWay('Tasks.taskEditorHelper*projects'),
    nameKey: 'displayName',
    valueKey: 'id',
    iconKey: 'icon',
    isEnabledBinding: 'Tasks.tasksController.isReallocatable'
  }),

  submitterLabel: SC.LabelView.design({
    layout: Tasks.isMobile? { top: 177, left: 0, height: 24, width: 55 } : { top: 72, right: 275, height: 24, width: 75 },
    textAlign: SC.ALIGN_RIGHT,
    value: "_Submitter:".loc()
  }),
  submitterField: SCUI.ComboBoxView.design({
    layout: Tasks.isMobile? { top: 175, left: 60, width: 252, height: 24 } : { top: 70, right: 10, width: 262, height: 24 },
    objectsBinding: SC.Binding.oneWay('Tasks.taskEditorHelper*users'),
    nameKey: 'displayName',
    valueKey: 'id',
    iconKey: 'icon',
    isEnabledBinding: 'Tasks.tasksController.isEditable'
  }),

  assigneeLabel: SC.LabelView.design({
    layout: Tasks.isMobile? { top: 212, left: 0, height: 24, width: 55 } : { top: 104, right: 275, height: 24, width: 75 },
    textAlign: SC.ALIGN_RIGHT,
    value: "_Assignee:".loc()
  }),
  assigneeField: SCUI.ComboBoxView.design({
    layout: Tasks.isMobile? { top: 210, left: 60, width: 252, height: 24 } : { top: 102, right: 10, width: 262, height: 24 },
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

if(Tasks.isMobile) Tasks.taskEditorOverviewView = Tasks.TaskEditorOverviewView.create();