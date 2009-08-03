/*
 * DataSource.java
 *
 * Created on July 4, 2005, 10:48 PM
 *
 * To change this basis, choose Tools | Options and locate the basis under
 * the Source Creation and Management node. Right-click the basis and choose
 * Open. You can then make changes to the basis in the Source Editor.
 */

package org.persvr.datasource;

import java.util.List;

import org.persvr.data.ObjectId;


/**
 *
 * @author Kris Zyp
 */
public interface ReferenceAwareDataSource extends DataSource {

	public List<ObjectId> getReferrers(String objectId);
}
