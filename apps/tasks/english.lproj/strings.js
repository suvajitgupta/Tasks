/*globals Tasks */

// Place strings you want to localize here.  In your app, use the key and
// localize it using "key string": "text".  HINT: For your key names, use the
// english string with an underscore in front.  This way you can still see
// how your UI will look and you'll notice right away when something needs a
// localized string added to this file!
//

/** @class

  @version 0.1
  @author Suvajit Gupta
*/
SC.stringsFor('English', {

  // Authentication strings
  '_LoginName:': "Login Name:",
  '_Login': "Login",
  '_LoginError': "Login failed, please try again",
  '_LoginSince': "Logged in since ",
  '_LogoutConfirmation': "Are you sure you want to log out?",

  // Top Bar strings
  '_Credits': "Credits: Suvajit Gupta, Sean Eidemiller, Josh Holt, Brandon Blatnick, Matt Grantham",
  '_Hi': "Hi ",
  '_Save': "Save",
  '_SaveTooltip': "Save Tasks data to the server",
  '_Import': "Import",
  '_ImportTooltip': "Import Tasks data from a text format",
  '_ImportInstructions:': "Paste or type in text to be imported:<br>(see format on right)",
  '_FormatOnscreenHelp': "Project Name {TimeLeft}<br>- Task Name {Effort} &lt;Submitter&gt; [Assignee] $Type @Status %Validation<br>| Description (1 or more lines)",
  '_Export': "Export",
  '_ExportTooltip': "Export Tasks data to a text format",
  '_Settings': "Settings",
  '_SettingsTooltip': "Manage Tasks users and settings",
  '_Help': "Help",
  '_HelpTooltip': "Launch Tasks help",
  '_Logout': "Logout",
  '_LogoutTooltip': "Logout from Tasks",
  "_AssigneeSelectionHint": "Specify assignee login names",
  '_TasksSearchHint': "Search by task #IDs or name",
  
  // Project strings
  '_AddProject': "Add Project",
  '_AddProjectTooltip': "Add a new project",
  '_DelProject': "Del. Project",
  '_DelProjectTooltip': "Delete selected project",
  '_ConfirmProjectDeletion': "Tasks in this project will become unallocated, are you sure you want to delete it?",
  '_NewProject': "New Project",
  '_AllTasks': "All Tasks",
  '_Unallocated': " unallocated",
  '_UnallocatedTasks': "Unallocated Tasks",
  '_Has': "Has ",
  '_Tasks': " task(s)",
  '_ProjectTimeLeftTooltip': "; Time left (if specified) shown on right",
  
  // Task strings
  '_AddTask': "Add Task",
  '_AddTaskTooltip': "Add a new task, to the same assignee if there is a selected task",
  '_NewTask': "New Task",
  '_DelTask': "Del. Task",
  '_DelTaskTooltip': "Delete selected task",
  '_FilterTasks': "Filter Tasks",
  '_FilterTasksTooltip': "Filter tasks using attributes (type, priority, status, validation)",
  '_Type': "TYPE",
  '_TypeTooltip': "Kind of task: user visible functionality, defect fix, or other",
  '_Feature': "Feature",
  '_Bug': "Bug",
  '_Other': "Other",
  '_Priority': "PRIORITY",
  '_PriorityTooltip': "Importance of task: must do, plan to do, do if you can",
  '_High': "High",
  '_Medium': "Medium",
  '_Low': "Low",
  '_Status': "STATUS",
  '_StatusTooltip': "Development status of task: show progress or obstacles",
  '_Planned': "Planned",
  '_Active': "Active",
  '_Done': "Done",
  '_Todo': "Todo",
  '_Risky': "Risky",
  '_Validation': "VALIDATION",
  '_ValidationTooltip': "Testing status of completed task - independent verification recommended",
  '_Untested': "Untested",
  '_Passed': "Passed",
  '_Failed': "Failed",
  '_Effort:': "Effort:",
  '_EffortOnscreenHelp': "You may leave effort unspecified, enter a decimal value like 0.25, or a range like 2-3 (time units are 'd' or 'h')",
  '_Description:': "Description:",
  '_SubmitterTooltip': "Submitted by ",
  '_TaskEffortTooltip': "Effort (if specified) shown on right",
  '_IdTooltip': "Unique ID for task; Dashes indicate unsaved tasks; Background color indicates validation status",
  '_EditorTooltip': "Click to view/edit task details (submitter, assignee, effort, and description)",
  '_TasksExportTimestamp': "# Tasks data export at ",
  
  // User/Assignee strings
  '_AddUser': "Add User",
  '_AddUserTooltip': "Add a new user",
  '_DelUser': "Del. User",
  '_DelUserTooltip': "Delete selected user",
  '_FullName:': "Full Name:",
  '_Role:': "Role:",
  '_FirstLast': "Firstname Lastname",
  '_Initials': "Initials",
  '_Unassigned': "Unassigned",
  '_Manager': "Manager",
  '_Developer': "Developer",
  '_Tester': "Tester",
  '_Guest': 'Guest',
  '_Submitter:': "Submitter: ",
  '_Assignee:': "Assignee: ",
  '_AssigneeNotLoaded': ", currently not loaded; ",
  '_AssigneeUnderLoaded': ", currently under loaded; ",
  '_AssigneeProperlyLoaded': ", currently properly loaded; ",
  '_AssigneeOverloaded': ", currently overloaded; ",
  '_AssigneeEffortTooltip': "Completed/remaining effort shown on right",
  "_NewUserSignup": "New user? Click here to signup.",
  "_SignupPrompt": "Please enter the following information to signup:",
  "_Email:": "Email:",
  "_InvalidEmailAddress": "This email address",
  "_EmailAddress": "Your Email Address",
  "_Password:": "Password:",
  "_PasswordHint": "Your Password",
  "_Signup": "Signup",
  
  // Popup Pane/Panel strings
  '_QuickFilters': "QUICK FILTERS",
  '_QuickFiltersTooltip': "Most commonly used filters",
  '_Troubled': "Troubled",
  '_TroubledTooltip': "Manage by exception - see risky and failed tasks",
  '_LeftTodo': "Left Todo",
  '_LeftTodoTooltip': "Get to the finish line - see what's left to do",
  '_LeftToTest': "Left to Test",
  '_LeftToTestTooltip': "Ensure quality - see what is left to validate",
  '_ReadyToShip': "Ready to Ship",
  '_ReadyToShipTooltip': "Deliver results - see what is ready for prime time",
  '_Showstoppers': "Showstoppers",
  '_ShowstoppersTooltip': "Review blockers - see remaining high priority bugs",
  '_ShowAll': "Show All",
  '_ShowAllTooltip': "Clear attribute filter - show all tasks",
  '_Cancel': "Cancel",
  '_Close': "Close",
  '_Apply': "Apply",
  
  // Status Bar strings
  '_Displaying': "Displaying ",
  '_Projects': " project(s), ",
  '_Assignees': " assignee(s), and ",
  '_UsersLoaded': "Loaded users, ",
  '_TasksLoaded': "tasks, ",
  '_ProjectsLoaded': " and projects.",
  '_SaveMessage': "Last saved "
    
});
