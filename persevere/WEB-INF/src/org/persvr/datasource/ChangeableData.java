/*
 * ChangeableData.java
 *
 * Created on September 30, 2005, 8:48 PM
 *
 * To change this basis, choose Tools | Options and locate the basis under
 * the Source Creation and Management node. Right-click the basis and choose
 * Open. You can then make changes to the basis in the Source Editor.
 */

package org.persvr.datasource;


/**
 *
 * @author Kris Zyp
 */
public interface ChangeableData {
	/**
	 * This indicates how long an object can be accessed by id before an id request should 
	 * go back to the data source for an update.
	 * @return
	 */
	public boolean doesObjectNeedUpdating(String id);
}
