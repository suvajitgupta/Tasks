/*
 * PartialMap.java
 *
 * Created on November 10, 2005, 7:29 PM
 *
 * To change this basis, choose Tools | Options and locate the basis under
 * the Source Creation and Management node. Right-click the basis and choose
 * Open. You can then make changes to the basis in the Source Editor.
 */

package org.persvr.data;

import java.util.Date;
import java.util.Map;
import java.util.Set;

import org.mozilla.javascript.Scriptable;


/**
 * This is interface that all persistable objects should implement
 * @author Kris Zyp
 */
public interface Persistable extends Scriptable{
	/**
	 * Gets a field without using JS getters
	 * @param key
	 * @return
	 */
    Object get(String key);
	/**
	 * Sets a value into a field persistently (even it has been declared persistent in the structure) without using JS setters
	 * @param key
	 * @return
	 */
    Object set(String name, Object value);
    public static final int ENTRY_SET_INCLUDE_DONT_ENUM = 1;
    public static final int ENTRY_SET_INCLUDE_GETTER_SETTER_FUNCTIONS = 2;
    public Set<Map.Entry<String, Object>> entrySet(int options);
    /*
     * Gets the id of this object
     * @return
     */
    public ObjectId getId();
    /**
     * Get the access level of the object
     * @return
     */
    public int getAccessLevel();
    /**
     * Gets the last committed modification to the object
     * @return
     */
    Date getLastModified();
    /**
     * Returns the schema for this object
     * @return
     */
    public Persistable getSchema();
    /**
     * Returns the version information for this object. 
     * @return
     */
    public Version getVersion();
    /**
     * Returns the parent of this object. Persevere has three internal uses for parents:
     *  <ul><li>If there is no acl defined, security is inherited from the parent</li>
     *  <li>Parents can define schemas that apply to the current object</li>
     *  <li>When deleting an object, an object is always deleted from the parent object</li></ul>
     *  
     * @return
     */
    public Persistable getParent();
    /**
     * Deletes the current object. 
     * @return
     */
    public void delete();
    /**
     * Called when an persistent object is first created (not when the Java object is created to restore state)
     */
    public void onCreation();
    @Deprecated
    public Object noCheckGet(String key);
    
}
