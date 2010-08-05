package org.persvr.util;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.security.PrivilegedAction;
import java.util.List;

import jline.ConsoleReader;

import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.persvr.data.DataSourceManager;
import org.persvr.data.GlobalData;
import org.persvr.data.PersistableObject;
import org.persvr.data.Transaction;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.javascript.PersevereNativeFunction;
import org.persvr.remote.Client;
import org.persvr.security.UserSecurity;

/**
 * Provides a console for interaction with the JavaScript environment on the server
 * @author Kris
 *
 */
public class Console extends Thread {
 
	public Console() {
		super("Persevere Console");
	}
	Context context;
	Scriptable global;
	Scriptable consoleScope;
	public static void main(String[] args){
		DataSourceManager.getDataSources(); // fire up the sources/DBs
		new Console().run();
	}
	
	@Override
	public void run() {
		try {
			// wait a little while so that the prompt can come after Jetty's messages about being started
			Thread.sleep(300);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
		UserSecurity.doPriviledgedAction(new PrivilegedAction(){
			Object output;
			public Object run() {
					Client connection = new Client("console");
					// give this thread a context/user
					Client.registerThisConnection(connection.getIndividualRequest(null, null));
					context = PersevereContextFactory.getContext();
					global = GlobalData.getGlobalScope();
					consoleScope = new NativeObject();
					// we may want to make this a prototype, so you can create unscoped variables without errors. Downside is it might mislead users as to what they can do in methods
					consoleScope.setParentScope(global);
					((NativeObject) consoleScope).setGetterOrSetter("help", 0, new PersevereNativeFunction(){

						@Override
						public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
							String help = "The full Persevere API is available at the console as described in http://docs.persvr.org/documentation/server-side-js\n";
							help += "Additionally there are the following special properties available at the console:\n";
							help += "autocommit - This indicate whether or not each command should be committed immediately (otherwise you must manually commit with commit())\n";
							help += "shutdown - Shuts down Persevere\n";
							return help;
						}
						
					}, false);
					((NativeObject) consoleScope).setGetterOrSetter("shutdown", 0, new PersevereNativeFunction(){
						@Override
						public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
							System.exit(0);
							return null;
						}
					}, false);
					Transaction.startTransaction();
					consoleScope.put("autocommit", consoleScope, true);
					PersistableObject.enableSecurity(true);
					
					try {
						ConsoleReader reader = new ConsoleReader();
						StringBuffer sb = new StringBuffer();
						reader.setBellEnabled(false);
						System.out.println("Type \"help\" at the console for more information");
						do {
							String prompt = (sb.length() > 0) ? "   " : "js>"; // no prompt if we're on a multiline
							String line = reader.readLine(prompt);
							if(line == null){
								// in eclipse jline doesn't work, so we have to resort standard System.in 
								char c;
								do{
									c = (char) System.in.read();
									if (c == (char) -1){
										System.out.println("Console not available (no valid input stream is present)");
										return null;
									}
									sb.append(c);
								}while(c != '\n');
							}
							else
								sb.append(line);
							if (context.stringIsCompilableUnit(sb.toString()))
							{
								// if it is syntactically finished, we evaluate 
								System.out.println(evaluate(sb.toString()));
								sb = new StringBuffer();
							}
						} while(true);
					} catch (Throwable e1) {
						LogFactory.getLog(Console.class).warn("Console not available: " + e1.getMessage());
					}
				return null;
			}
		});
	}
	/**
	 * Evaluates an expression within a transaction and returns the result
	 * @param expression
	 * @return
	 */
	String evaluate(String expression){
		try {
			Object value = context.evaluateString(consoleScope, expression, "console", 0, null);
			if (ScriptRuntime.toBoolean(consoleScope.get("autocommit", consoleScope))) {
				try{
					Transaction.currentTransaction().commit();
				}
				finally{
					Transaction.startTransaction();
				}
			}
			if(value == Undefined.instance)
				return "";
			if(value instanceof List){
				return "[object Array of " + ((List)value).size() + " elements]";
			}
			return ScriptRuntime.toString(value);
		} catch (Throwable e) {
			if (ScriptRuntime.toBoolean(consoleScope.get("autocommit", consoleScope))) {
				Transaction.currentTransaction().abort();
				Transaction.startTransaction();
			}
			if(e instanceof RhinoException)
				return ((RhinoException)e).details() + '\n' + ((RhinoException)e).getScriptStackTrace();
			else {
				StringWriter sw = new StringWriter();
				e.printStackTrace(new PrintWriter(sw));
				return sw.toString();
			}
		}

	}
    static String uneval(Context cx, Scriptable scope, Object value)
    {
        if (value == null) {
            return "null";
        }
        if (value == Undefined.instance) {
            return "undefined";
        }
        if (value instanceof String) {
            String escaped = ScriptRuntime.escapeString((String)value);
            StringBuffer sb = new StringBuffer(escaped.length() + 2);
            sb.append('\"');
            sb.append(escaped);
            sb.append('\"');
            return sb.toString();
        }
        if (value instanceof Number) {
            double d = ((Number)value).doubleValue();
            if (d == 0 && 1 / d < 0) {
			  return "-0";
            }
            return ScriptRuntime.toString(d);
        }
        if (value instanceof Boolean) {
            return ScriptRuntime.toString(value);
        }
        if (value instanceof Scriptable) {
            Scriptable obj = (Scriptable)value;
            // Wrapped Java objects won't have "toSource" and will report
            // errors for get()s of nonexistent name, so use has() first
            if (ScriptableObject.hasProperty(obj, "toSource")) {
			  Object v = ScriptableObject.getProperty(obj, "toSource");
			  if (v instanceof Function) {
			      Function f = (Function)v;
			      return ScriptRuntime.toString(f.call(cx, scope, obj, ScriptRuntime.emptyArgs));
			  }
            }
            return ScriptRuntime.toString(value);
        }
        return value.toString();
    }

}
