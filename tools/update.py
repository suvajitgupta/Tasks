from helpers import cmd, filetools
import os.path

cmd.setBase(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

commands = [
  cmd.relative(""),
  # Ensure that all frameworks are present for the build later
  ["git", "submodule", "init"],
  ["git", "submodule", "sync"],
  ["git", "submodule", "update"],
  # Then Clone the Tasks GAE backend
  cmd.relative("tasks_gae"),
  ["git", "pull", "origin", "master"],
]

def run(appID, buildID):
  if not appID or not buildID:
    print "Please supply application indetifier and build identifier."
    return
  else:
    # Build a prod version of Tasks
    commands.append(cmd.relative(""))
    commands.append(["sc-build", "-rc", "--build=%s" % buildID])
    
    # Copy prod build to Tasks GAE backend (cloned eariler)
    commands.append(cmd.relative("tasks_gae"))
    commands.append(["cp", "-r", "../tmp/build/static", "."])
    
    # Run the commands
    cmd.run(commands)
    
    # Configure app.yaml in tasks_gae
    file_to_configure = cmd.relative("tasks_gae/app.yaml")
    app_regex = r'^application\:\s+(\w+-\w+)'
    build_regex = r'^\s+\w+\:\s+static\/tasks\/en\/(.*)\/index\.html'
    
    filetools.replaceStringsInFile(file_to_configure, app_regex, "%s" % appID)
    filetools.replaceStringsInFile(file_to_configure, build_regex, "%s" % buildID)

if __name__ == "main":
	run()