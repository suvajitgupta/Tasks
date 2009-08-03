package org.persvr.datasource;

import java.security.acl.Acl;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.persvr.data.ObjectId;
import org.persvr.data.Persistable;
import org.persvr.data.Version;

public class MapInitializer implements PersistableInitializer {
	Map<String,Object> map = new HashMap<String,Object>();
	public void finished() {
	}

	public Persistable getInitializingObject() {
		throw new UnsupportedOperationException("Not implemented yet");
	}

	public void initializeFunction(String source, boolean authorizedOnServer) {
		throw new UnsupportedOperationException("Not implemented yet");
	}

	public void setLastModified(Date lastModified) {
	}
	public void setVersion(Version version) {
		throw new UnsupportedOperationException("Not implemented yet");
	}

	public void initializeList(Collection iterator) {
		throw new UnsupportedOperationException("Not implemented yet");
	}

	public void setAcl(Acl acl) {
	}

	public void setCacheLevel(long time) {
	}

	public void setParent(ObjectId objectToInheritFrom) {
	}

	public void setPersistentAcl(ObjectId aclId) {
	}

	public void setProperty(String name, Object value) {
		map.put(name,value);
	}
	public void setProperty(String name, Object value, int attributes) {
		map.put(name,value);
	}
	
	public void setSchema(Persistable schema) {
	}

	public Map<String,Object> getMap() {
		return map;
	}

}
