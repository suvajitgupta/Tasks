package org.persvr.util;

import org.mozilla.javascript.FunctionNode;
/**
 * This is JavaScript AST Node for a function with the added ability to track the 
 * original source (including comments), so we don't lose information from
 * decompilation. This is used by the JSON parser so functions can be stored
 * intact.
 * @author Kris
 *
 */
public class SourceTrackingFunctionNode extends FunctionNode {

	public SourceTrackingFunctionNode(String name) {
		super(name);
	}
	int sourceStart;
	int sourceEnd;
	
    public int getSourceStart() {
		return sourceStart;
	}

	public void setSourceStart(int sourceStart) {
		this.sourceStart = sourceStart;
	}

	public int getSourceEnd() {
		return sourceEnd;
	}

	public void setSourceEnd(int sourceEnd) {
		this.sourceEnd = sourceEnd;
	}

}
