import subprocess
import sys
import os, os.path
import time
import multiserve

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
			print "Executing: " + ' '.join(command)
			multiserve.run((command,))
