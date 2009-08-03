package org.persvr.javascript;

import java.io.File;
import java.io.FileFilter;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.security.PrivilegedAction;
import java.util.List;

import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.Scriptable;
import org.persvr.data.GlobalData;
import org.persvr.data.PersistableObject;
import org.persvr.data.Transaction;
import org.persvr.remote.Client;
import org.persvr.security.UserSecurity;
/**
 * Executes a set of tests
 * @author Kris
 *
 */
public class TestRunner extends BaseFunction implements Runnable {
	public static int totalPassingTests = 0;
	public static int totalTests = 0;
	static Log log = LogFactory.getLog(TestRunner.class);
	/**
	 * Runs the tests from the test directory
	 * @param testsDirectory
	 */
	public void run(){
		String testsDirectory = System.getProperty("persevere.tests");
		// run the tests and then exit the VM, so we can run a report and finish
		log.info("Running Tests at " + testsDirectory);
		Client connection = new Client("testing");
		Client.registerThisConnection(connection.getIndividualRequest(null, null));

		try {
			File[] testFiles = new File(testsDirectory).listFiles(new FileFilter(){
				public boolean accept(File pathname) {
					return pathname.isFile() && pathname.getName().endsWith(".js");
				}
			});
			if(testFiles == null || testFiles.length == 0)
			{
			  log.warn("no test files found - exiting");
  			System.exit(1);
			}
			for (final File testFile : testFiles){
				log.info("Testing " + testFile.getName());
				final Scriptable scope = new NativeObject();
				scope.setParentScope(GlobalData.getGlobalScope());

				// execute the script, the TestRunner will provide the necessary API
				UserSecurity.doPriviledgedAction(new PrivilegedAction(){
					public Object run() {
						try {
							PersevereContextFactory.getContext().evaluateString(
									scope, 
									IOUtils.toString(new FileInputStream(testFile)), 
									testFile.getName(), 1, null);
						} catch (Throwable e) {
							if(e instanceof RhinoException) {
								log.error(((RhinoException)e).details() + '\n' + ((RhinoException)e).getScriptStackTrace() + 
								((e instanceof EvaluatorException) ?
									"in " + ((EvaluatorException)e).getSourceName() + " line: " + ((EvaluatorException)e).getLineNumber() + ": " + ((EvaluatorException)e).getLineSource() : ""));
							}
							else
								log.error("", e);

						}
						return null;
					}
				});
			}
		} catch (Throwable e) {
			e.printStackTrace();
			log.error(e);
			System.exit(1);
		}
		
		int failures = totalTests - totalPassingTests;
		log.info("Testing Complete.  " + totalPassingTests + " passed, " + failures + " failed.");
		System.exit( (failures == 0) ? 0 : 1);
	}
	public static void debug(){
		System.err.println("debug");
	}
	@Override
	public Object call(final Context cx, final Scriptable scope, final Scriptable thisObj, final Object[] args) {
		Transaction.startTransaction();
		PersistableObject.enableSecurity(true);
		for(Object testObject : ((List)args[0])){
			Scriptable test = (Scriptable) testObject;
			String name = "anonymous";
			Function testFunction;
			Object nameObject;
			if(test instanceof Function){
				testFunction = (Function) test;
			}
			else{
				testFunction = (Function) test.get("runTest", test);
				nameObject = test.get("name", test);
				if (nameObject instanceof String)
					name =  (String) nameObject;
			}
			nameObject = testFunction.get("name", test);
			if (nameObject instanceof String)
				name =  (String) nameObject;
			
			try{
			  totalTests++;
				testFunction.call(cx, scope, thisObj, args);
				try{
					Transaction.currentTransaction().commit();
				}
				finally{
					Transaction.startTransaction();
				}
				totalPassingTests++;
			} catch(Throwable e){
				if(e instanceof RhinoException)
					log.error(((RhinoException)e).details() + '\n' + ((RhinoException)e).getScriptStackTrace());
				else
					log.error("", e);
				log.error("Test failed: " + name);
			}
		}
		return null;
	}
	
}