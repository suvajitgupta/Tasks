package org.persvr.javascript;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.TimerTask;
import java.util.regex.Pattern;

import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.persvr.data.DataSourceManager;
import org.persvr.data.GlobalData;
import org.persvr.data.Transaction;

public class ModuleLoader extends PersevereNativeFunction {
	String currentJslibPath = "";
	// create the require function so dependencies can be done in proper order
	Map<String,ScriptableObject> exports = new HashMap<String,ScriptableObject>();
	Map<String,File> jslibFiles = new HashMap<String,File>();
	Scriptable global = GlobalData.getGlobalScope();
	Log log = LogFactory.getLog(ModuleLoader.class);
	Map<String, Long> lastTimeStamps = new HashMap<String, Long>();
	File jslibDirectory;
	public ModuleLoader(){
		global.put("require", global, this);
	}
	public void scanForFiles(File jslibDirectory){
		this.jslibDirectory = jslibDirectory;
		scanForFiles();
	}
	public void scanForFiles(){
		try {
			if(jslibDirectory.exists())
				for(File file : DataSourceManager.getConfigFiles(jslibDirectory)){
					String path = file.getCanonicalPath();
					path = path.replace(File.separatorChar, '/');
					path = path.split("\\/jslib\\/")[1];
					jslibFiles.put(path, file);
				}
		} catch (IOException e) {
			throw new RuntimeException(e);
		}

	}
	public void loadFiles(){
		for(String filename : new HashSet<String>(jslibFiles.keySet())){
			try {
				call(PersevereContextFactory.getContext(), global, global, new Object[]{filename});
			} catch (RhinoException e) {
				log.error(e.details() + " on line " + e.lineNumber() + " in " + e.sourceName() + '\n'+ e.getScriptStackTrace());
			} catch (Throwable e) {
				throw new RuntimeException("Trying to load " + filename, e);
			}
		}

	}
	@Override
	synchronized public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
		Transaction previousTransaction = Transaction.currentTransaction();
		Transaction.startTransaction();
		String filename = (String) args[0];
		if(filename.startsWith("."))
			filename = currentJslibPath + filename;
		filename = Pattern.compile("\\.\\./[^.]*/").matcher(filename).replaceAll("/");
		filename = filename.replace("./", "");
		InputStream inStream;
		ScriptableObject exportObject;
		String oldJsLibPath = currentJslibPath;
		try {
			File jslibFile = jslibFiles.get(filename);
			if(jslibFile == null && !filename.endsWith(".js")){
				filename += ".js";
				jslibFile = jslibFiles.get(filename);
			}
			if(jslibFile == null)
				throw ScriptRuntime.constructError("Error", "File not found " + filename);
			exportObject = exports.get(filename);
			Long lastTimeStamp = lastTimeStamps.get(filename);
			if(lastTimeStamp == null || lastTimeStamp < jslibFile.lastModified()){
				lastTimeStamps.put(filename, jslibFile.lastModified());
				inStream = new FileInputStream(jslibFile);
				exportObject = new NativeObject(); 
				ScriptRuntime.setObjectProtoAndParent((ScriptableObject) exportObject, global);
				// setup the module scope
				ScriptableObject moduleScope = new NativeObject();
				moduleScope.setParentScope(global);
				int lastSlash = filename.lastIndexOf('/');
				currentJslibPath = lastSlash == -1 ? "" : filename.substring(0,lastSlash + 1); 
				moduleScope.put("exports", moduleScope, exportObject);
				// memoize
				exports.put(filename, exportObject);
				// evaluate the script
				try {
					cx.evaluateString(moduleScope, IOUtils.toString(inStream, "UTF-8"), filename, 1, null);
				} catch (RuntimeException e) {
					// revert
					exports.remove(filename);
					jslibFiles.put(filename, jslibFile);
					throw e;
				}
				// re-retrieve it in case the library changed it
				exportObject = (ScriptableObject) moduleScope.get("exports", moduleScope);
				exports.put(filename, exportObject);

				if("jsgi-app.js".equals(filename)){
					// handle jackconfig.js, setting up the app if it is there
					global.put("app", global, exportObject.get("app", exportObject));
				}
				// freeze it
				//exportObject.sealObject();
			}
			Transaction.currentTransaction().commit();
		} catch (IOException e) {
			throw ScriptRuntime.constructError("Error",e.getMessage());
		}
		finally{
			currentJslibPath = oldJsLibPath; 
			previousTransaction.enterTransaction();
		}
		return exportObject;
	}
	public void freezeExports(){
		for(String filename : new HashSet<String>(jslibFiles.keySet())){
			try {
				ScriptableObject exportObject = (ScriptableObject) call(PersevereContextFactory.getContext(), global, global, new Object[]{filename});
				exportObject.sealObject();
			} catch (RhinoException e) {
				log.error(e.details() + " on line " + e.lineNumber() + " in " + e.sourceName() + '\n'+ e.getScriptStackTrace());
			}
		}

	}
	public void startTimer(){
		GlobalData.jsTimer.schedule(new TimerTask(){

			@Override
			public void run() {
				try{
					scanForFiles();
					loadFiles();
				} catch (Throwable e){
					log.error(e);
				}
			}
			
		}, 1000, 500);
	}
}
