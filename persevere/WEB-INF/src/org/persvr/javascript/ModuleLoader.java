package org.persvr.javascript;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.TimerTask;
import java.util.regex.Pattern;

import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.persvr.data.DataSourceManager;
import org.persvr.data.GlobalData;
import org.persvr.data.PersistableClass;
import org.persvr.data.Transaction;

public class ModuleLoader extends PersevereNativeFunction {
	String currentJslibPath = "";
	// create the require function so dependencies can be done in proper order
	Map<File,ScriptableObject> exports = new HashMap<File,ScriptableObject>();
	ScriptableObject global = GlobalData.getGlobalScope();
	Log log = LogFactory.getLog(ModuleLoader.class);
	Map<File, Long> lastTimeStamps = new HashMap<File, Long>();
	NativeArray pathsArray;
	NativeArray autoLoadArray;
	public ModuleLoader(){
		global.put("require", global, this);
		global.setAttributes("require", ScriptableObject.PERMANENT);
	}
	public void providePaths(Object[] paths){
		pathsArray = new NativeArray(paths);
		ScriptRuntime.setObjectProtoAndParent((ScriptableObject) pathsArray, global);
		autoLoadArray = new NativeArray(paths.length == 1 ? new Object[]{true} : new Object[]{true, true});
		ScriptRuntime.setObjectProtoAndParent((ScriptableObject) autoLoadArray, global);
		this.put("paths", this, pathsArray);
		this.setAttributes("paths", ScriptableObject.PERMANENT);
		this.put("autoLoad", this, autoLoadArray);
		this.setAttributes("autoLoad", ScriptableObject.PERMANENT);
	}
	public void scanForFiles(){
		PersistableClass.persistClass.set(false);
		for(int i = 0; i < pathsArray.getLength(); i++){
			String path = pathsArray.get(i, pathsArray).toString();
			if(Boolean.TRUE.equals(autoLoadArray.get(i, autoLoadArray))){
				for(File file : DataSourceManager.getConfigFiles(new File(path))){
					try {
						call(PersevereContextFactory.getContext(), global, global, new Object[]{file});
					} catch (RhinoException e) {
						log.error(e.details() + " on line " + e.lineNumber() + " in " + e.sourceName() + '\n'+ e.getScriptStackTrace());
					} catch (Throwable e) {
						throw new RuntimeException("Trying to load " + file.getAbsolutePath(), e);
					}
				}
			}
		}
	}
	@Override
	synchronized public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
		Transaction previousTransaction = Transaction.currentTransaction();
		int pathsCount = (int) pathsArray.getLength();
		File jslibFile = null;
		String filename;
		String oldJsLibPath = currentJslibPath;
		ScriptableObject exportObject;
		try {
			if(args[0] instanceof File){
				jslibFile = (File) args[0];
				filename = jslibFile.getCanonicalPath();
				filename = filename.replace(File.separatorChar, '/');
				for(int i = 0; i < pathsCount; i++){
					String path = pathsArray.get(i, pathsArray).toString();
					path = new File(path).getCanonicalPath().replace(File.separatorChar, '/');
					if(path.length() > 0 && !(path.endsWith("/") || path.endsWith(File.separator)))
						path += '/';
					if(filename.indexOf(path) > -1){
						filename = filename.substring(filename.indexOf(path) + path.length());
						break;
					}
				}
			}
			else {
				filename = args[0].toString();
				if(filename.startsWith("."))
					filename = currentJslibPath + filename;
				filename = Pattern.compile("[^\\/]*\\/\\.\\.\\/").matcher(filename).replaceAll("");
				filename = filename.replace("./", "");
				for(int i = 0; i < pathsCount; i++){
					String path = pathsArray.get(i, pathsArray).toString();
					if(path.length() > 0 && !(path.endsWith("/") || path.endsWith(File.separator)))
						path += '/';
					jslibFile = new File(path + filename);
					if(jslibFile.isFile())
						break;
					if(!filename.endsWith(".js")){
						filename += ".js";
						jslibFile = new File(path + filename);
						if(jslibFile.isFile())
							break;
					}
				}
			}
			String id = filename;
			if (filename.endsWith(".js"))
				id = filename.substring(0, filename.length() - 3);
			if(jslibFile == null || !jslibFile.isFile())
				throw ScriptRuntime.constructError("Error", "File not found " + filename);
			exportObject = exports.get(jslibFile);
			Long lastTimeStamp = lastTimeStamps.get(jslibFile);
			if(lastTimeStamp == null || lastTimeStamp < jslibFile.lastModified()){
				Transaction.startTransaction();
				lastTimeStamps.put(jslibFile, jslibFile.lastModified());
				FileInputStream inStream = new FileInputStream(jslibFile);
				exportObject = new NativeObject(); 
				ScriptRuntime.setObjectProtoAndParent((ScriptableObject) exportObject, global);
				ScriptableObject moduleObject = new NativeObject(); 
				ScriptRuntime.setObjectProtoAndParent((ScriptableObject) moduleObject, global);
				moduleObject.put("id", moduleObject, id);
				// setup the module scope
				ScriptableObject moduleScope = new NativeObject();
				moduleScope.setParentScope(global);
				int lastSlash = filename.lastIndexOf('/');
				currentJslibPath = lastSlash == -1 ? "" : filename.substring(0,lastSlash + 1); 
				moduleScope.put("exports", moduleScope, exportObject);
				moduleScope.put("module", moduleScope, moduleObject);
				// memoize
				exports.put(jslibFile, exportObject);
				// evaluate the script
				try {
					cx.evaluateString(moduleScope, IOUtils.toString(inStream, "UTF-8"), filename, 1, null);
				} catch (RuntimeException e) {
					// revert
					exports.remove(jslibFile);
					throw e;
				}
				// re-retrieve it in case the library changed it
				exportObject = (ScriptableObject) moduleScope.get("exports", moduleScope);
				exports.put(jslibFile, exportObject);

				if("jsgi-app.js".equals(filename)){
					// handle jackconfig.js, setting up the app if it is there
					global.put("app", global, exportObject.get("app", exportObject));
				}
				// freeze it
				//exportObject.sealObject();
				Transaction.currentTransaction().commit();
			}
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
		throw new RuntimeException("not implemented");
		/*
		for(String filename : new HashSet<String>(jslibFiles.keySet())){
			try {
				ScriptableObject exportObject = (ScriptableObject) call(PersevereContextFactory.getContext(), global, global, new Object[]{filename});
				exportObject.sealObject();
			} catch (RhinoException e) {
				log.error(e.details() + " on line " + e.lineNumber() + " in " + e.sourceName() + '\n'+ e.getScriptStackTrace());
			}
		}
*/
	}
	public void startTimer(){
		GlobalData.jsTimer.schedule(new TimerTask(){

			@Override
			public void run() {
				try{
					scanForFiles();
				} catch (Throwable e){
					log.error(e);
				}
			}
			
		}, 1000, 500);
	}
}
