package org.persvr.rpc;

import java.util.Date;

public abstract class RPCMessage implements Comparable {
	protected Object id;
	private long issued;
	protected RPCMessage() {
		issued = new Date().getTime();
	}
	public long getIssued() {
		return issued;
	}
	public Object getId() {
		return id;
	}
	public int compareTo(Object o) {
		if (issued > ((RPCMessage)o).issued)
			return -1;
		else if (issued == ((RPCMessage)o).issued)
			return 0;
		else 
			return 1;
	}
	final static int MESSAGE_TIMEOUT = 300000; // 5 minutes 
	public boolean expired() {
		return new Date().getTime() - issued > MESSAGE_TIMEOUT;
	}
}
