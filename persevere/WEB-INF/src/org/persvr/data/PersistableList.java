package org.persvr.data;

import java.util.Collection;
import java.util.List;


public interface PersistableList<K> extends List<K>,Persistable {
	public void initSourceCollection(Collection sourceCollection);
}
