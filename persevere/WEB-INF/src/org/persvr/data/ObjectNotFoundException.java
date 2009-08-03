package org.persvr.data;

import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.NativeObject;
import org.persvr.datasource.DataSource;

public class ObjectNotFoundException extends EcmaError {
	

	public ObjectNotFoundException(final DataSource source, final String resource) {
		super(new NativeObject(){
			public Object getDefaultValue(Class typeHint){
				return (source == null ? "" : source.getId() + '/') + resource + " not found";
			}
		}, null,0,0,null);
		this.source = source;
	}
	DataSource source;
	public DataSource getSource() {
		return source;
	}
}
