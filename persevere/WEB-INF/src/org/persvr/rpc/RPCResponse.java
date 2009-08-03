package org.persvr.rpc;

public class RPCResponse extends RPCMessage {
	private Object result;
	private String error;
	public String getError() {
		return error;
	}
	public Object getResult() {
		return result;
	}
	public RPCResponse(Object id, Object result, String error) {
		super();
		this.id = id;
		this.result = result;
		this.error = error;
	}
	
}
