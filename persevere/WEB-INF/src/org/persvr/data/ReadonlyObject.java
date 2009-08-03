package org.persvr.data;

import java.util.Date;

import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.persvr.security.PermissionLevel;

public abstract class ReadonlyObject extends ScriptableObject implements Persistable{
	@Override
	public String getClassName() {
		return getClass().getName();
	}

	public void delete() { 
		throw new RuntimeException("Readonly " + getClassName() + " can not be deleted");
	}
	@Override
	public Object get(String key,Scriptable start) {
		return get(key);
	}
	public Object defaultGet(String key,Scriptable start) {
		return super.get(key, start);
	}
	public int getAccessLevel() {
		return PermissionLevel.READ_LEVEL.level;
	}

	public Persistable getSchema() {
		return null;
	}

	public Object set(String name, Object value) {
		throw new RuntimeException("An SMD is readonly for now, writing has not been implemented yet");
	}

	public PersistableList<Persistable> getHistory() {
		return null;
	}
	public void onCreation() {
		// do nothing
	}
	public Object noCheckGet(String key) {
		return get(key);
	}
    public Date getLastModified() {
   		return new Date();
   	}

	public Version getVersion() {
		return null;
	}
   

}
