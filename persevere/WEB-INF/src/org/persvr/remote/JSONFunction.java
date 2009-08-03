package org.persvr.remote;



public class JSONFunction {
	
	String source;
	public JSONFunction(String source){
		this.source = source;
	}
	public String toJSONString() {
		return source;
	}
	@Override
	public String toString() {
		return source;
	}
}
