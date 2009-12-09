def run():
	print
	print "The Commands That Can be Issued:"
	print "================================================================="
	print "setup:         Builds a production version of Tasks. Checks out"
	print "               the GAE backend. Copies the procudtion build to"
	print "               the GAE backend. Generates the app.yaml. Asks for"
	print "               Application Identifier."
	print
	print "               params: <GAE application indetifier>,"
	print "                       <Tasks Build Number or Name>"
	print
	print "start:         starts the local dev server."
	print
	print "               params: <optional port number>"
	print
	print "clean:         destroys the tmp directory which holds dev and"
	print "               production builds."
	print
	print

if __name__ == "main":
	run()