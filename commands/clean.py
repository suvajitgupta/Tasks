from helpers import cmd
import os.path

cmd.setBase(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

commands = [
  
	cmd.relative("frameworks"),
	["rm", "-r", "scui"],
	["rm", "-r", "sproutcore"],
	
	cmd.relative(""),
	["rm", "-r", "tmp"],
	["rm", "-r", "tasks_gae"],
]

def run():
	cmd.run(commands)

if __name__ == "main":
	run()