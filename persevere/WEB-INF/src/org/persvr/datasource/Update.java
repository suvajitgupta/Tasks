package org.persvr.datasource;

import org.persvr.data.ObjectId;

public class Update {
	public enum UpdateType{
		New, Change, Delete
	}

	ObjectId target;
	UpdateType updateType;
	public Update(ObjectId target, UpdateType updateType) {
		super();
		this.target = target;
		this.updateType = updateType;
	}
	public ObjectId getTarget() {
		return target;
	}
	public UpdateType getUpdateType() {
		return updateType;
	}
}
