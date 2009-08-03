package org.persvr.data;

import java.security.PrivilegedAction;
import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.persvr.remote.PersevereFilter;
import org.persvr.security.UserSecurity;
/**
 * This is the server-side persevere library for the JavaScript running on the server.
 * @author Kris
 *
 */
public class PersevereLibrary extends NativeObject {
	public String getClassName() {
		return "Persevere";
	}
	private Log log = LogFactory.getLog(PersevereLibrary.class);

	public PersevereLibrary() {
		super();
/*		put("_query", this, new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				if (!(args[0] instanceof Persistable))
					return Undefined.instance;
				List list = (List) args[0];
				String query = (String) ((Function) ScriptableObject.getProperty(((Scriptable)args[1]),"toString")).call(cx, scope , ((Scriptable)args[1]), new Object[]{});
				Scriptable paramsScope = (Scriptable) args[2];
				try {
					return Query.parseQuery((Persistable) list, query, paramsScope).getTarget();
				} catch (QueryCantBeHandled e) {
					log.debug("query can't be handled ",e);
					return Undefined.instance;
				}
			}
			
		});*/
	}
	
}
