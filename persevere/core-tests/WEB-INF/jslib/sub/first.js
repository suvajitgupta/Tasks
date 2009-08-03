require("./second.js");
if(!third || !second)
	throw new Error("second and third not loaded yet");
coreTests = true;