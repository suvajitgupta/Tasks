/*
 * Id.java
 *
 * Created on August 11, 2005, 9:54 PM
 *
 * To change this basis, choose Tools | Options and locate the basis under
 * the Source Creation and Management node. Right-click the basis and choose
 * Open. You can then make changes to the basis in the Source Editor.
 */

package org.persvr.data;


import java.util.ArrayList;
import java.util.List;

import org.persvr.datasource.DataSource;
import org.persvr.util.JSON;
import org.persvr.util.JSONParser;



/**
 *
 * @author Kris Zyp
 * This class represents a select query
 */
public class ObjectPath extends Identification<Object> {
	@Override
	protected Object resolveTarget() {
		throw new RuntimeException("getTarget should always be used for ObjectPath");
	}
	List<Object> pathParts = new ArrayList<Object>();
	private ObjectPath(){
	}
	public ObjectPath(ObjectId objId, List<Object> pathParts) {
		this.subObjectId = objId.subObjectId;
		this.source = objId.source;
		this.pathParts = pathParts;
	}


	public static synchronized ObjectPath idForObject(DataSource source, String subObjectId, String path) {
		ObjectPath objId = new ObjectPath();
		objId.source = source;
		objId.subObjectId= subObjectId;
		while (path.length() > 0) {
			if (path.charAt(0)=='.' || path.charAt(0) == '#') {
				path = path.substring(1);
				String prop = path.split("[\\.\\[].*",2)[0];
				if(prop.matches("[0-9]+"))
					objId.pathParts.add(Integer.parseInt(prop));
				else
					objId.pathParts.add(prop);
				path = path.substring(prop.length());
			}
			else {
				List array = (List) new JSONParser().read(path);
				objId.pathParts.add(array.get(0));
				path = path.substring(JSON.serialize(array).length());
			}
		}
		return objId;
	}

	
	@Override
	public Object getTarget() {
		Object target = ObjectId.idForObject(source, subObjectId).getTarget(); 
		for (Object path : pathParts) {
			if (path instanceof Integer)
				target = ((Persistable)target).get((Integer)path,(Persistable)target);
			else
				target = ((Persistable)target).get(path.toString());
		}
		return target;
	}
	public Persistable getSecondToLastTarget() {
		Object target = ObjectId.idForObject(source, subObjectId).getTarget();
		int i = 1;
		for (Object path : pathParts) {
			if (i++ < pathParts.size()) {
				if (path instanceof Integer)
					target = ((Persistable)target).get((Integer)path,(Persistable)target);
				else
					target = ((Persistable)target).get(path.toString());
			}
		}
		//TODO: Put in a good error message when target is not Persistable
		return (Persistable) target;
	}
	public Object getLastPath() {
		return pathParts.get(pathParts.size()-1);
	}

	private String makePathPart() {
		StringBuffer str = new StringBuffer();
		for (Object path : pathParts) {
			if (path instanceof Integer)
				str.append("[" + path + "]");
			else if (((String)path).matches("\\w[0-9\\w]*"))
				str.append("." + path);
			else
				str.append("[" + JSON.quote((String) path)+ "]");
		}
		return str.toString();

	}


	@Override
	public String toString() {
		return super.toString() + makePathPart();
	}
	

}
