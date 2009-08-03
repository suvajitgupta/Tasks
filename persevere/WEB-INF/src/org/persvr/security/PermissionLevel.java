/*
 * PermissionLevel.java
 *
 * Created on July 4, 2005, 11:15 PM
 *
 * To change this basis, choose Tools | Options and locate the basis under
 * the Source Creation and Management node. Right-click the basis and choose
 * Open. You can then make changes to the basis in the Source Editor.
 */

package org.persvr.security;

import java.security.acl.Permission;

import org.persvr.data.PersistableObject;

/**
 *
 * @author Kris Zyp
 * @deprecated
 */
public enum PermissionLevel implements Cloneable,Permission {
	NONE_LEVEL(0,"none"),
	LIMITED_LEVEL(1,"limited"),
	READ_LEVEL(2,"read"),
	EXECUTE_LEVEL(3,"execute"),
	APPEND_LEVEL(4,"append"),
	WRITE_LEVEL(5,"write"),
	FULL_LEVEL(6,"full");
	
	PermissionLevel(int level,String name) {
		this.level = level;
		this.name = name;
		PersistableObject.permissionNames.put(name, this);
	}
	public int level = 1;
	public String name;
	public boolean canExecute() {
		return level > 2; 
	}
	public boolean canWrite() {
		return level > 4;
	}
	public boolean canRead() {
		return level > 1;
	}
	public boolean canAppend() {
		return level > 3;
	}
	public boolean canBrowse() {
		return level > 0;
	}
}
