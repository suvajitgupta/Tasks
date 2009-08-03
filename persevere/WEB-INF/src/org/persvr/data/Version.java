package org.persvr.data;

public interface Version {
	public Persistable getPreviousVersion();
	public int getVersionNumber();
	public boolean isCurrent();
}
