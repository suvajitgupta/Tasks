# Just handles running multiple processes automatically

import async
import subprocess
import sys
import os, os.path
import time

base = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
def setBase(path):
	global base
	base = os.path.abspath(path)

def relative(path):
	global base
	return os.path.join(base, path)

def run(commands):
	processes = []
	for command in commands:
		if isinstance(command, basestring):
			os.chdir(command)
		else:
			process = async.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
			processes.append(process)
	
	try:
		while True:
			working = 0
			for process in processes:
				content = ""
				content = process.recv()
				content_err = process.recv_err()
				
				if not content:
					content = ""
				if content_err:
					content += content_err
				
				if content is not None:
					sys.stdout.write(content)
					sys.stdout.flush()
				
				if process.poll() is None:
					working += 1
			
			if working == 0:
				print "Done."
				break
			time.sleep(.01)
	except KeyboardInterrupt:
		for process in processes:
			if process.poll() is None:
				process.terminate()
		print ""
		print "All Done here."
