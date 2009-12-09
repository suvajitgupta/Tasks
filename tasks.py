import sys
if len(sys.argv) < 2:
	command = "usage"
else:
	command = sys.argv[1]

if command == "setup":
  if len(sys.argv) > 3:
	  import commands.setup
	  commands.setup.run(sys.argv[2], sys.argv[3])
  else:
    import commands.usage
    commands.usage.run()	  
elif command == "clean":
	import commands.clean
	commands.clean.run()
elif command == "start":
  import commands.start
  if sys.argv[2]:
    commands.start.run(sys.argv[2])
  else:
    commands.start.run()
elif command == "usage":
	import commands.usage
	commands.usage.run()