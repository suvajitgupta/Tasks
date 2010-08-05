package org.persvr.data;


import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

import org.apache.commons.httpclient.Header;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.HttpException;
import org.apache.commons.httpclient.HttpMethod;
import org.apache.commons.httpclient.MultiThreadedHttpConnectionManager;
import org.apache.commons.httpclient.methods.DeleteMethod;
import org.apache.commons.httpclient.methods.GetMethod;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.httpclient.methods.PutMethod;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Callable;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.persvr.Persevere;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.javascript.PersevereNativeFunction;
import org.persvr.javascript.TestRunner;
import org.persvr.remote.Client;
import org.persvr.remote.PersevereFilter;
import org.persvr.remote.Client.IndividualRequest;
import org.persvr.security.UserSecurity;



/**
 *	This provides access to global data within Persevere and setups the top level JavaScript runtime environment
 * that is shared by all JavaScript components in Persevere.
 * @author Kris Zyp
 */
public class GlobalData  {
	public static final String CONTAINS_REPEATING_IDENTIFIER = ":isList";
	public static final String TEMPLATES_FIELD = "templates"; 
    static final String CONFIGURATION_FILE_PATH_FROM_WEB_INF = "/classes/DataSources.json";
    public static String webInfLocation = null;
	public static String getWebInfLocation() {
		if (webInfLocation == null){
			String thisResource = "org/persvr/data/GlobalData.class";
			ClassLoader classLoader = GlobalData.class.getClassLoader();
			if(classLoader == null){
				classLoader = ClassLoader.getSystemClassLoader();
			}
			String sourcesConfigurationFileLocation = classLoader.getResource(thisResource).toString();
			sourcesConfigurationFileLocation = sourcesConfigurationFileLocation.substring(0,sourcesConfigurationFileLocation.length() - thisResource.length());
			// remove the last two paths
			if (sourcesConfigurationFileLocation.startsWith("jar:")) {
				sourcesConfigurationFileLocation= sourcesConfigurationFileLocation.substring("jar:".length());
				sourcesConfigurationFileLocation = sourcesConfigurationFileLocation.substring(0,sourcesConfigurationFileLocation.lastIndexOf('/'));
			}
			sourcesConfigurationFileLocation = sourcesConfigurationFileLocation.substring(0,sourcesConfigurationFileLocation.lastIndexOf('/'));
			sourcesConfigurationFileLocation = sourcesConfigurationFileLocation.substring(0,sourcesConfigurationFileLocation.lastIndexOf('/'));
			sourcesConfigurationFileLocation = sourcesConfigurationFileLocation.replaceAll("%20", " ");
			webInfLocation = sourcesConfigurationFileLocation;
		}
		return webInfLocation;
	}
    public static final String FUNCTION_COMPILED_CODE_FIELD = "psv15"; 
    public static final String FUNCTION_METHOD_FIELD = "function";  
    public static final String FUNCTION_RUN_AT_FIELD = "runAt";  
    public static final String FUNCTION_RUN_AT_SERVER = "server";  
    public static final String FUNCTION_RUN_AT_BOTH = "both";  
    public static final String FUNCTION_RUN_AT_CLIENT = "client";  
    public static final String ALWAYS_DOWNLOAD_FUNCTION= "alwaysDownload";
    static ScriptableObject globalScope;
    public static class PersistableConstructor extends BaseFunction {
    	PersistableConstructor(Scriptable prototype, String name) {
    		setInstanceIdValue(4, prototype); // 4 = Id-prototype
    		this.name = name;
    	}
    	String name;
		@Override
		public String getFunctionName() {
			return name;
		}
    	
    }
    public static String localURI;
    static {
    	try {
			localURI = "http://" + InetAddress.getLocalHost().getHostName();
			String port = System.getProperty("persevere.port");
			if(port != null)
				localURI += ":" + port;
			String baseURI = System.getProperty("persevere.base-uri");
			localURI += baseURI == null ? "/" : baseURI;
		} catch (UnknownHostException e) {
			throw new RuntimeException(e);
		}
    }
	private static Log log = LogFactory.getLog(GlobalData.class);
    public static Timer jsTimer;
    static {
    	try{
    		jsTimer = new Timer("JavaScript events thread", true);
    	}catch(Exception e) {
    		log.warn("Couldn't start timer ", e);
    	}
    }
    static Map<Integer,TimerTask> currentQueuedTasks = new Hashtable<Integer,TimerTask>();
    static int taskId = 0;

    private static Runnable runnableInNewThread(final Scriptable scope, Object[] args, String name) {
		if(args.length == 0 || !(args[0] instanceof Callable))
			throw ScriptRuntime.constructError("TypeError", "The first parameter of " + name + " must be a function");
		final Callable function = (Callable) args[0];
		TimerTask timeoutTask;
		final int thisTaskId = taskId++;
		final Object user = UserSecurity.currentUser();
		IndividualRequest request = Client.getCurrentObjectResponse();
		final Client session = request == null ? null : Client.getCurrentObjectResponse().getConnection();

		return new Runnable(){

			public void run() {
				try{
					if(session != null)
						session.adoptThread(Thread.currentThread());
					UserSecurity.registerThisThread(user);
					Transaction.startTransaction();
					function.call(PersevereContextFactory.getContext(), scope, null, new Object[]{});
					Transaction.currentTransaction().commit();
				}catch(Throwable e){
					if(e instanceof RhinoException)
						log.warn(((RhinoException)e).details() + '\n' + ((RhinoException)e).getScriptStackTrace());
					else
						log.warn("", e);
				}

			}
			
		};
    }
    @SuppressWarnings("serial")
	static class ThreadConstructor extends PersevereNativeFunction{

		@Override
		public Scriptable construct(Context cx, Scriptable scope, Object[] args) {
			final Thread thread = new Thread(runnableInNewThread(scope, args, "Thread"));
			Persistable jsThread = Persevere.newObject();
			jsThread.put("join", jsThread, new PersevereNativeFunction(){

				@Override
				public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
					try {
						thread.join();
					} catch (InterruptedException e) {
						throw new RuntimeException(e);
					}
					return null;
				}
				
			});
			thread.start();
			return jsThread;
		}
    	
    }
    /**
     * Provides timer facilities for setTimeout, setInterval, clearTimeout, and clearInterval
     * @author Kris
     *
     */
    @SuppressWarnings("serial")
	static class TimerFunction extends PersevereNativeFunction{
    	boolean repeated;
		public TimerFunction(boolean repeated) {
			super();
			this.repeated = repeated;
		}
		@Override
		public Object call(Context cx, final Scriptable scope,
				Scriptable thisObj, Object[] args) {
			if(jsTimer == null)
				ScriptRuntime.constructError("Error", "Timer is not available");
			int delay = 0;
			if(args.length > 1 && args[1] instanceof Number){
				delay = ((Number) args[1]).intValue();
			}
			TimerTask timeoutTask;
			final int thisTaskId = taskId++;
			IndividualRequest request = Client.getCurrentObjectResponse();
			final Client session = request == null ? null : Client.getCurrentObjectResponse().getConnection();
			final Runnable runnable = runnableInNewThread(scope, args, repeated ? "setInterval" : "setTimeout");			
			currentQueuedTasks.put(thisTaskId,timeoutTask = new TimerTask(){
				@Override
				public void run() {
					// ensure that we don't access the same transient values with more than one thread
					synchronized(session == null ? new Object() : session){
						TimerTask activeTask = repeated ? currentQueuedTasks.get(thisTaskId) : currentQueuedTasks.remove(thisTaskId);
						// make sure it is still queued and hasn't been cancelled
						if(activeTask != null){
							runnable.run();
						}
					}
				
				}
				
			});
			if(repeated)
				jsTimer.schedule(timeoutTask, delay, delay);
			else
				jsTimer.schedule(timeoutTask, delay);
			
			return thisTaskId;
		}
		
	}
    /**
     * Gets the global object, the host object for this instance of Persevere. There is one global object used by
     * the entire system. 
     * @return
     */
    public static ScriptableObject getGlobalScope() {
    	if (globalScope == null) {
			Context cx= PersevereContextFactory.getContext();
			// create the global object
			globalScope = (ScriptableObject) cx.initStandardObjects(new ProtectedGlobal());
			final Scriptable objectPrototype = ScriptableObject.getObjectPrototype(globalScope);
			final Scriptable arrayPrototype = ScriptableObject.getClassPrototype(globalScope,"Array");
			final Scriptable functionPrototype = ScriptableObject.getClassPrototype(globalScope,"Function");
			// create our own Object that creates persistable objects
/*			Scriptable persistableObject = new PersistableConstructor(objectPrototype, "Object") {
				@Override
				public Scriptable construct(Context cx, Scriptable scope, Object[] args) {
					ScriptableObject newObject = new PersistableObject();
					newObject.setParentScope(globalScope);
					newObject.setPrototype(objectPrototype);
					return newObject;
				}
			};
			persistableObject.setPrototype(functionPrototype);
			globalScope.put("Object", globalScope, persistableObject);
			// create our own Array that creates persistable objects
			Scriptable persistableArray = new PersistableConstructor(arrayPrototype, "Array") {
				@Override
				public Scriptable construct(Context cx, Scriptable scope, Object[] args) {
					ScriptableObject newObject;
					if(args.length == 0)
						newObject = new PersistableArray(0);
					else if(args.length == 1)
						newObject = new PersistableArray(((Number)args[0]).longValue());
					else
						newObject = new PersistableArray(args);
					newObject.setParentScope(globalScope);
					newObject.setPrototype(arrayPrototype);
					return newObject;
				}
				
			};
			globalScope.put("Array", globalScope, persistableArray);
			persistableArray.setPrototype(functionPrototype);*/
			// setup the native libraries in the global environment
			Scriptable pjsLibrary = new PjsLibrary();
			pjsLibrary.setPrototype(objectPrototype);
			globalScope.put("pjs", globalScope, pjsLibrary);
			Scriptable consoleLibrary = new ConsoleLibrary();
			consoleLibrary.setPrototype(objectPrototype);
			globalScope.put("console", globalScope, consoleLibrary);
			// provide access to the request
			((ScriptableObject)globalScope).setGetterOrSetter("request", 0, new PersevereNativeFunction() {
				@Override
				public Object call(Context cx, Scriptable scope,
						Scriptable thisObj, Object[] args) {
					return Client.getCurrentObjectResponse().getHttpRequest();
				}
				
			}, false);
			((ScriptableObject)globalScope).setGetterOrSetter("response", 0, new PersevereNativeFunction() {
				@Override
				public Object call(Context cx, Scriptable scope,
						Scriptable thisObj, Object[] args) {
					return Client.getCurrentObjectResponse().getHttpResponse();
				}
				
			}, false);
			
			globalScope.put("Thread", globalScope, new ThreadConstructor());
			globalScope.put("global", globalScope, globalScope);
			globalScope.put("setTimeout", globalScope, new TimerFunction(false));
			globalScope.put("setInterval", globalScope, new TimerFunction(true));
			Function clearTimer = new PersevereNativeFunction() {
				@Override
				public Object call(Context cx, final Scriptable scope,
						Scriptable thisObj, Object[] args) {
					if(args.length > 0 && args[0] instanceof Number)
						currentQueuedTasks.remove(((Number)args[0]).intValue()).cancel();
					return Undefined.instance;
				}
			};
			globalScope.put("clearTimeout", globalScope, clearTimer);
			globalScope.put("clearInterval", globalScope, clearTimer);
			globalScope.put("tests", globalScope, new TestRunner());

			((NativeObject)globalScope).setGetterOrSetter("profiling",0, new PersevereNativeFunction(){
				@Override
				public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
					if(Boolean.TRUE.equals(args[0]))
						Method.startProfiling();
					else
						Method.profiling = false;
					return null;
				}
			},true);
			((NativeObject)globalScope).setGetterOrSetter("profiling",0, new PersevereNativeFunction(){
				@Override
				public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
					return Method.profiling;
				}
			},false);
			globalScope.put("XMLHttpRequest",globalScope, new PersevereNativeFunction(){

				@Override
				public Scriptable construct(Context cx, Scriptable scope, Object[] args) {
					XMLHttpRequest xhr = new XMLHttpRequest();
					xhr.setPrototype(objectPrototype);
					return xhr;
				}
				
			});
			globalScope.put("version", globalScope, Persevere.getPersevereVersion());
    	}
    	return globalScope;
    }
	static MultiThreadedHttpConnectionManager connectionManager = 
  		new MultiThreadedHttpConnectionManager();
  	public static HttpClient httpClient = new HttpClient(connectionManager);

    /**
     * Implements XMLHttpRequest for the server for making HTTP requests
     */
    static class XMLHttpRequest extends NativeObject {
    	String targetUrl;
    	String responseText;
    	String methodName;
    	int status = 0;
    	int readyState = 0;
    	Map<String,String> requestHeaders = new HashMap();
    	Map responseHeaders = new HashMap();
		@Override
		public Object get(String name, Scriptable start) {
			if("open".equals(name)){
				return new PersevereNativeFunction(){
					@Override
					public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
						methodName = (String) args[0];
						targetUrl = (String) args[1];
						if(!targetUrl.matches("\\w+tps?:/.*"))
							targetUrl = localURI + (targetUrl.startsWith("/") ? targetUrl.substring(1) : targetUrl); 
						requestHeaders.put("Accept", "*/*");
						responseText = null;
						return null;
					}
					
				};
			}
			if("send".equals(name)){
				return new PersevereNativeFunction(){
					@Override
					public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
						responseText = null;
					  	HttpMethod method = null;
					  	if("GET".equals(methodName)){
					  		method = new GetMethod(targetUrl);
					  	}
					  	else if("PUT".equals(methodName)){
					  		method = new PutMethod(targetUrl);
					  		((PutMethod)method).setRequestBody((String) args[0]);
					  	}
					  	else if("POST".equals(methodName)){
					  		method = new PostMethod(targetUrl);
					  		((PostMethod)method).setRequestBody((String) args[0]);
					  	}
					  	else if("DELETE".equals(methodName)){
					  		method = new DeleteMethod(targetUrl);
					  	}
					  	else
					  		throw new RuntimeException("Unknown method for XMLHttpRequest");
					  	try {
					  		for(Map.Entry<String,String> header : requestHeaders.entrySet())
					  			method.setRequestHeader(header.getKey(), header.getValue());
							status = httpClient.executeMethod(method);
							for(Header header : method.getResponseHeaders()){
								responseHeaders.put(header.getName(), header.getValue());
							}
							
							responseText = slurp(method.getResponseBodyAsStream());
						} catch (HttpException e) {
							throw ScriptRuntime.constructError("Error", e.getMessage());
						} catch (IOException e) {
							throw ScriptRuntime.constructError("Error", e.getMessage());
						}
						finally {
							method.releaseConnection();
						}
					  	readyState = 4;
					  	Object readyStateChangeHandler = XMLHttpRequest.this.get("onreadystatechange",XMLHttpRequest.this);
					  	if(readyStateChangeHandler instanceof Function){
					  		((Function)readyStateChangeHandler).call(cx, scope, thisObj, new Object[0]);
					  	}
					  	return null;
					}
					
				};
			}
			if("readyState".equals(name))
				return readyState;
			if("status".equals(name))
				return status;
			if("getResponseHeader".equals(name)){
				return new PersevereNativeFunction(){
					@Override
					public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
						return responseHeaders.get(args[0]);
					}
					
				};
			}
			if("setRequestHeader".equals(name)){
				return new PersevereNativeFunction(){
					@Override
					public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
						return requestHeaders.put(args[0].toString(),ScriptRuntime.toString(args[1]));
					}
					
				};
			}
			if("abort".equals(name)){
				// it's always synchronous, not sure we need to do anything here
				return new PersevereNativeFunction(){
					@Override
					public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
						return null;
					}
					
				};
			}
			if("responseText".equals(name)){
				return responseText;
			}
			return super.get(name, start);
		}

    	
    }
	public static String slurp(InputStream in) throws IOException {
		StringBuffer out = new StringBuffer();
		if ( in != null ) {
			byte[] b = new byte[4096];
			for (int n; (n = in.read(b)) != -1;) {
				out.append(new String(b, 0, n));
			}
		}
		return out.toString();
	}
    /* The code below is used for debugging */
    public static void printStackTrace() {
        try { throw new RuntimeException("here"); } catch (Exception e) { e.printStackTrace(); }
    }
    public static void breakPoint(){
    	System.err.println("breakpoint");
    }
    static class DumpThread extends Thread {

		@Override
		public void run() {
			while(true){
				try {
					Thread.sleep(100);
					Map<Thread,StackTraceElement[]> threads = Thread.getAllStackTraces();
					for (StackTraceElement[] stes : threads.values()){
						if (stes.length > 10 && 
								stes[0].getMethodName().indexOf("dumpThreads") == -1 &&
								stes[0].getMethodName().indexOf("kevent") == -1 &&
								stes[0].getMethodName().indexOf("poll") == -1) {
							if (stes[0].getMethodName().indexOf("scan_token") != -1){
								System.err.println("scan token");
							}else{
								System.err.println("");
								for(StackTraceElement ste : stes){
									System.err.println(ste);
								}
							}
						}
					}
				} catch (Throwable e) {
					e.printStackTrace();
				}
				
			}
		}
    	
    }
    static class LogStatus extends Thread {

		@Override
		public void run() {
			Client connection = new Client("dump");
			Client.registerThisConnection(connection.getIndividualRequest(null, null));
			while(true){
				try {
					Thread.sleep(50000);
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
				Scriptable global = getGlobalScope();
				System.err.println("status: " + ((Function)global.get("serialize", global)).call(PersevereContextFactory.getContext(), global, global, new Object[]{
					Persevere.load("status")}));
				//System.err.println("used: " + (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) + "total: " + Runtime.getRuntime().totalMemory() + " free: " + Runtime.getRuntime().freeMemory());
				
			}
		}
    }
    static {
    	//new DumpThread().start();
    	if(System.getenv().get("persevere_logStatus") != null)
    		new LogStatus().start();
    }
}
