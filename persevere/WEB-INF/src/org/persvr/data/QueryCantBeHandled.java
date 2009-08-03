package org.persvr.data;

/**
 * This is an exception indicating that the data source can not 
 * natively handle the query. When this is thrown, usually this
 * will result in the query engine falling back to JavaScript-based
 * JSONPath evaluation, which should still work, but will probably be
 * slower.
 * @author Kris
 *
 */
public class QueryCantBeHandled extends RuntimeException {

	public QueryCantBeHandled(String message) {
		super(message);
		// TODO Auto-generated constructor stub
	}

	public QueryCantBeHandled() {
		super();
		// TODO Auto-generated constructor stub
	}

}
