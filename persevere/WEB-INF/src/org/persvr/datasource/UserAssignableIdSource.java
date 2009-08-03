package org.persvr.datasource;


public interface UserAssignableIdSource {
	boolean isIdAssignable(String objectId);
	public void setIdSequence(long nextId);
	public String newId();
}
