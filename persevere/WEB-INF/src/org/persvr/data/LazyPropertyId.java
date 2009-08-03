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

import org.persvr.datasource.DataSource;


/**
 *
 * @author Kris Zyp
 */
public class LazyPropertyId extends Identification<Object> {
	String field;
	public LazyPropertyId(ObjectId parentId, String field) {
		this.source = parentId.source;
		this.subObjectId = parentId.subObjectId;
		this.field = field;
	}
	public LazyPropertyId(DataSource source, String objectId, String field) {
		this.field = field; 
		this.source = source;
		this.subObjectId = objectId;
	}
	
	@Override
	public Object resolveTarget() {
		try {
	        return source.getFieldValue(this);
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
	public String getField() {
		return field;
	}
	@Override
	public String toString() {
		return super.toString() + '.' + field;
	}

}
