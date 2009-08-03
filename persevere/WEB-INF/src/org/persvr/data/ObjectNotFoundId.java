package org.persvr.data;

import org.persvr.datasource.DataSource;

/**
 * Represents an ID that doesn't have a source
 * @author Kris
 *
 */
public class ObjectNotFoundId extends ObjectId {

	public ObjectNotFoundId(DataSource source, String id) {
		subObjectId = id;
		this.source = source;
	}

	@Override
	protected Persistable resolveTarget() {
		throw new ObjectNotFoundException(source,toString());
	}
	public Persistable getOrCreateTarget() {
		throw new ObjectNotFoundException(source,toString());
	}
}
