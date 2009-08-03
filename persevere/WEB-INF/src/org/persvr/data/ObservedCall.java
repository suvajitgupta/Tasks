package org.persvr.data;

import org.persvr.remote.Client;
/**
 * A representation of a call that took place that should be delivered as a notification to subscribers
 * @author Kris
 *
 */
@SuppressWarnings("serial") 
public class ObservedCall extends java.util.EventObject{
	String method; // the method that was called
	Object content; // the data that was passed into the call
	Client excludedClient; // the client that initiate the call, and can be excluded from notification
	public ObservedCall(ObjectId source, String method, Object content,Client excludedClient) {
		super(source);
		this.method = method;
		this.content = content;
		this.excludedClient = excludedClient;
	}
	public ObjectId getSourceId() {
		return (ObjectId) source;
	}
	public Persistable getSource() {
		return ((ObjectId) source).getTarget();
	}
	public String getMethod() {
		return method;
	}
	public Object getContent() {
		return content;
	}
	public Client getExcludedClient() {
		return excludedClient;
	}	
}
