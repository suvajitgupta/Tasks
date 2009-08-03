package org.persvr.remote;



public class JSONCall {
	
	String function;
	Object[] args;
	public JSONCall(String function, Object[] args){
		this.function = function;
		this.args = args;
	}
	@Override
	public String toString() {
		String output = function + "(";
		for (Object param : args){
			if (param != args[0]) 
				output += ",";
			output += param;
		}
		return output + ")";
	}
}
