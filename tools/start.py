from helpers import multiserve
import os.path

multiserve.setBase(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
commands = [
	multiserve.relative(""),
]

def run(port):
  if port:
    commands.append(["sc-server", "--port", "%s" % port])
  else:
    commands.append(["sc-server"])
  
	multiserve.run(commands)

	
if __name__ == "main":
	run()