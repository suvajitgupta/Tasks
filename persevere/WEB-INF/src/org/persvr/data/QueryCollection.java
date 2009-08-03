package org.persvr.data;

import java.util.Collection;

public interface QueryCollection extends Collection {
	public long estimatedSize(long exactWithin);
}
