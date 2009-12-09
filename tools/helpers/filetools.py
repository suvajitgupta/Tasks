import fileinput, re, sys

def replaceStringsInFile(file_to_configure, search, replacement):
  """This method will replace <search> in <file_to_configure> with <replacement>"""
  
  print "Configuring GAE %s with your information..." % file_to_configure
  
  for line in fileinput.FileInput(file_to_configure,inplace=1):
    match = re.match(search, line)
    if match != None:
      if len(match.groups()) > 0:
        line=line.replace(match.groups()[0],replacement)
    sys.stdout.write(line)
