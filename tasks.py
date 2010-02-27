import sys
if len(sys.argv) < 2:
	command = "usage"
else:
	command = sys.argv[1]

if command == "setup":
  if len(sys.argv) > 3:
	  import tools.setup
	  tools.setup.run(sys.argv[2], sys.argv[3])
  else:
    import tools.usage
    tools.usage.run()
elif command == "update":
  if len(sys.argv) > 3:
	  import tools.update
	  tools.update.run(sys.argv[2], sys.argv[3])
  else:
    import tools.usage
    tools.usage.run()
elif command == "clean":
	import tools.clean
	tools.clean.run()
elif command == "start":
  import tools.start
  if sys.argv[2]:
    tools.start.run(sys.argv[2])
  else:
    tools.start.run()
elif command == "usage":
	import tools.usage
	tools.usage.run()