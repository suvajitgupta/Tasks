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
  '_TypeTooltip': "Specify the kind of the selected task (user visible functionality, defect fix, or other)",
  '_Feature': "Feature",
  '_Bug': "Bug",
  '_Other': "Other",
  '_Priority': "PRIORITY",
  '_PriorityTooltip': "Specify the importance of the selected task (must do, plan to do, try to do)",
  '_High': "High",
  '_Medium': "Medium",
  '_Low': "Low",
  '_Status': "STATUS",
  '_StatusTooltip': "Specify development status of the selected task",
  '_Planned': "Planned",
  '_Active': "Active",
  '_Done': "Done",
  '_Todo': "Todo",
  '_Risky': "Risky",
  '_Validation': "VALIDATION",
  '_ValidationTooltip': "Specify testing status of the selected task (only for tasks that are done)",
  '_Untested': "Untested",
  '_Passed': "Passed",
  '_Failed': "Failed",
  '_Effort:': "Effort:",
  '_EffortOnscreenHelp': "You may leave effort unspecified, enter a decimal value like 0.25, or a range like 2-3 (time units are 'd' or 'h')",
  '_Description:': "Description:",
  '_SubmitterTooltip': "Submitter is ",
  '_TaskEffortTooltip': "Effort (if specified) shown on right",
  '_IdTooltip': "Unique ID for task, background color indicates validation status",
  '_EditorTooltip': "Click to view/edit task details (submitter, assignee, effort, and description)",
  
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
  
  // Popup Pane/Panel strings
  '_EnableAll': "Enable All",
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
  '_SaveMessage': "Last saved ",
  
  // Signup Strings
  "_Signup": "Signup",
  "_SignupLabelButton": "Need an account? Click here.",
  "_SignupPrompt": "Complete the information below to signup:",
  "_User Info:": "User Info:",
  "_Email:": "Email:",
  "_InvalidEmailAddress": "This email address",
  "_EmailAddress": "Your Email Address",
  "_Password:": "Password",
  "_PasswordHint": "Your Password"
  
});
