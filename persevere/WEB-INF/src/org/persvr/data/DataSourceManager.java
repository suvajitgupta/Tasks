package org.persvr.data;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.security.acl.Acl;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;
import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.persvr.Persevere;
import org.persvr.datasource.AbstractJsonSource;
import org.persvr.datasource.ClassDataSource;
import org.persvr.datasource.DataSource;
import org.persvr.datasource.DataSourceCanHaveOrphans;
import org.persvr.datasource.JavaScriptDBSource;
import org.persvr.datasource.DestroyAwareDataSource;
import org.persvr.datasource.LocalJsonFileSource;
import org.persvr.datasource.PersistableInitializer;
import org.persvr.datasource.SourceDeleteAware;
import org.persvr.datasource.WritableDataSource;
import org.persvr.javascript.ModuleLoader;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.remote.Client;
import org.persvr.remote.DataSerializer;
import org.persvr.remote.PersevereFilter;
import org.persvr.security.Capability;
import org.persvr.util.JSON;
import org.persvr.util.JSONParser.JSONException;


/**
 * The DataSourceManager is a utility class for managing all the data sources
 * utilized by Persevere
 * 
 * @author Kris
 * 
 */
public class DataSourceManager {
	static Map<String, DataSource> dataSources = new HashMap();;
	static Set<String> dataSourcesVisible;
	public static ClassDataSource metaClassSource = new ClassDataSource();
	static WritableDataSource configSource;
	public static boolean softReferences = true;
	
	private static final Log log = LogFactory.getLog(DataSourceManager.class);
	/**
	 * Holds important information about each data source
	 * 
	 * @author Kris
	 * 
	 */
	public static class SourceInfo {
		//TODO: Store the id of the source in here instead of forcing the source to implement getId and setId
		public Class<? extends Persistable> objectsClass;
		String objectsClassName;
		public PersistableClass schema;
		public File sourceFile;
	}
	static Map<DataSource, SourceInfo> sourceInfo = new HashMap();
	static {
		metaClassSource.setId("Class");
		dataSources.put("Class", metaClassSource);
		SourceInfo info = new SourceInfo();
		info.objectsClassName = PersistableClass.class.getName();
		//		info.schema = (Schema) ObjectId.idForObject(rootSource, null).getTarget();
		sourceInfo.put(metaClassSource, info);
	}
	public static WritableDataSource baseObjectSource;
	static final String AUTO_GENERATED_SOURCE_CONFIG_FILE = "generated.js";
	public static File configDirectory;
	static String webInfPath;
	static String defaultSourceClass;
	public static List<File> getConfigFiles(File configDirectory){
		if(!configDirectory.isDirectory()){
			throw new RuntimeException("The specified config directory path " + configDirectory.getPath() + " is not a directory");
		}
		List<File> files = new ArrayList<File>();
		for(File file : configDirectory.listFiles()){
			if(file.isDirectory() && file.getName().charAt(0) != '.'){
				files.addAll(getConfigFiles(file));
			}else if(file.getName().toLowerCase().endsWith(".js") || file.getName().toLowerCase().endsWith(".json")){
				files.add(file);
			}
		}
		return files;
	}
	static {
		try {
			dataSourcesVisible = new HashSet();
			// Mess of trying to find out the WEB-INF path, so we can put the data stuff there.
			String webInfLocation = GlobalData.getWebInfLocation();
			//System.err.print("webInfLocation " + webInfLocation);
			webInfPath = URLDecoder.decode(webInfLocation.substring("file:/".length()));
			if (webInfPath.charAt(1) != ':') // for unix, we want the / on the front
				webInfPath = '/' + webInfPath;
			String dataDirectoryPath = System.getProperty("persevere.instance.data");
			if(dataDirectoryPath == null)
				dataDirectoryPath = webInfPath + "/data";
			
			File dataDirectory = new File(dataDirectoryPath);
			//System.err.print("dataDirectoryPath " + dataDirectory.getCanonicalPath());
			if (!dataDirectory.exists())
				dataDirectory.mkdir();
			
			// start finding the config files
			configDirectory = new File(webInfPath + File.separatorChar + "config");
			if (!configDirectory.exists())
				configDirectory.mkdir();
			//			System.err.println("webInfPath " + webInfPath);
			//			System.err.println("data Directory " + webInfPath + "/data");
			List<File> listConfigFiles = getConfigFiles(configDirectory);
			File jslibDirectory = new File(webInfPath + File.separatorChar + "jslib");
			ModuleLoader moduleLoader = new ModuleLoader();
			List jslibPaths = new ArrayList(); 
			jslibPaths.add(jslibDirectory);
			// if there is an Persevere instance, we want to load the config files from there as well
			String instanceWebInfPath = System.getProperty("persevere.instance.WEB-INF");
			//System.err.print("instanceConfigPath " + instanceConfigPath);
			if(instanceWebInfPath != null){
				// make this _the_ config directory so new sources are created in the instance
				File newConfigDirectory = new File(instanceWebInfPath + "/config");
				if(!newConfigDirectory.getCanonicalPath().equals(configDirectory.getCanonicalPath())){
					configDirectory = newConfigDirectory;
					listConfigFiles.addAll(getConfigFiles(configDirectory));
					File instanceJsLibDirectory = new File(instanceWebInfPath + "/jslib");
					jslibPaths.add(instanceJsLibDirectory);
				}
			}
			moduleLoader.providePaths(jslibPaths.toArray());
			
			File[] configFiles = listConfigFiles.toArray(new File[listConfigFiles.size()]);
			
			
			// must ensure that core.json comes first
			for (int i = 0; i < configFiles.length; i++) {
				if (configFiles[i].getName().equals("core.json")) {
					//found core.json, must put it first
					File oldFirst = configFiles[0];
					configFiles[0] = configFiles[i];
					configFiles[i] = oldFirst;
					break;
				}
			}
			List<Map> classConfigs = new ArrayList();
			List<String> serverScriptsToRun = new ArrayList();
			
			for (File configFile : configFiles) {
				String configurationFile = IOUtils.toString(new FileInputStream(configFile));
				Map config;
				try {
					config = (Map) JSON.parse(configurationFile);
					if("weak".equals(config.get("references"))){
						softReferences = false;
					}
				} catch (JSONException e) {
					throw new RuntimeException("Error in " + configFile, e);
				}
			}
			for (File configFile : configFiles) {
				// load all the configuration files
				String configurationFile = IOUtils.toString(new FileInputStream(configFile));
				configurationFile = configurationFile.replaceAll("\\$DATA-DIR\\$", dataDirectory.getCanonicalPath().replace('\\', '/'));
				Map config = (Map) JSON.parse(configurationFile);
				try {
					List serializers = (List) config.get("serializers");
					if (serializers != null)
						for (int i = 0; i < serializers.size(); i++)
							Client.addSerializer((DataSerializer) Class.forName((String) serializers.get(i)).newInstance());
				} catch (Exception e) {
					log.debug(e);
					
					
					throw new RuntimeException(e);
				}
				List dataSourceConfigs = (List) config.get("sources");
				// get the class configs and order them by extends so the base classes are loaded before sub classes
				if (dataSourceConfigs != null)
					for (int i = 0; i < dataSourceConfigs.size(); i++) {
						try {
							Map dataSourceElement = (Map) dataSourceConfigs.get(i);
							if(configFile.getCanonicalPath().startsWith(configDirectory.getCanonicalPath()) && !"core.json".equals(configFile.getName())){
								// this is from the current config directory
								dataSourceElement.put("__location", configFile.getCanonicalPath().substring(configDirectory.getCanonicalPath().length() + 1)
										+ LocalJsonFileSource.pathSeparator + "sources" + LocalJsonFileSource.pathSeparator + i);
							}
							else{
								//this was inherited, so we will make it readonly
								dataSourceElement.put("__location", configFile.getName() + LocalJsonFileSource.pathSeparator + "sources" + LocalJsonFileSource.pathSeparator + i);
								dataSourceElement.put("__body", IOUtils.toString(new FileInputStream(configFile)));
							}
							String name = (String) dataSourceElement.get("name");
							boolean inserted = false;
							for(int j = 0;j < classConfigs.size(); j++){
								Map classConfig = classConfigs.get(j);
								if(name.equals(classConfig.get("extends"))){
									classConfigs.add(j, dataSourceElement);
									inserted = true;
									break;
								}
							}
							if(!inserted)
								classConfigs.add(dataSourceElement);
						} catch (Exception e) {
							log.debug(e);							
						}

					}
				Integer maxIterations = (Integer) config.get("maxIterations");
				if (maxIterations != null)
					PersistableArray.setMaxIterations(maxIterations);
				Object repl = config.get("repl");
				if(repl instanceof Boolean){
					PersevereFilter.startConsole = (Boolean) repl;
				}
				String localURI = (String) config.get("localURI");
				if (localURI != null)
					GlobalData.localURI = localURI;
				List serverScriptsJSON = (List) config.get("serverScripts");
				if (serverScriptsJSON != null)
					for (int i = 0; i < serverScriptsJSON.size(); i++) {
						serverScriptsToRun.add((String) serverScriptsJSON.get(i));
					}
				String newDefaultSourceClass = (String) config.get("defaultSourceClass");
				if(newDefaultSourceClass != null)
					defaultSourceClass = newDefaultSourceClass;
			}
			
			// load the sources in the correct order now
			for(Map classConfig : classConfigs){
				try{
					initSource(classConfig, (String) classConfig.get("__location"), null, (String) classConfig.get("__body"));
				} catch (Exception e) {
					String filename = (String) classConfig.get("__location");
					try{
						filename = filename.substring(0, filename.indexOf(LocalJsonFileSource.pathSeparator));
					}
					catch(Exception e2){
					}
					log.error("Error attempting to initialize the data source " + classConfig.get("name") + " in file " + filename, e);
				}
			}

			JavaScriptDBSource.initialize();
			AbstractJsonSource.suppressWrites = false;
			final Scriptable global = GlobalData.getGlobalScope();
			
			PersistableClass classClass = (PersistableClass) ObjectId.idForObject(metaClassSource, "Class").getTarget();
			
			// create the schema helpers
			PersistableClass.setupSchema(classClass);
			// create the security helpers
			Capability.setupSecurity();
			// load the server scripts
			for(String serverScript : serverScriptsToRun){
				File scriptFile = new File(instanceWebInfPath + "/classes/" + serverScript);
				if(!scriptFile.exists()){
					scriptFile = new File(webInfPath + "/classes/" + serverScript);
				}
				InputStream inStream;
				if(scriptFile.exists()){
					inStream = new FileInputStream(scriptFile);
				}else{
					// could be in our class path
					inStream = DataSourceManager.class.getClassLoader().getResourceAsStream(serverScript);
				}				
				if(inStream == null)
					throw new RuntimeException("Server script " + serverScript + " was not found");
				PersevereContextFactory.getContext().evaluateString(global,
						IOUtils.toString(inStream), serverScript, 0, null);
				
			}
			
			QueryArray.setupQuery();
			Status.initialize();
			// load all the files in the jslib dir by calling the require function
			moduleLoader.scanForFiles();
			Capability.grabSecurityHandlers();
			// now freeze the exports
			//moduleLoader.freezeExports();
			// start the timer for the checking for changes
			moduleLoader.startTimer();
			((ProtectedGlobal) global).getId().assignId(DataSourceManager.getSource(".Global."), "global");
			((ProtectedGlobal) global).parent = null;
			if(Boolean.TRUE.equals(global.get("freezeEnvironment", global)))
				((ProtectedGlobal) global).freeze();
		} catch (IOException e) {			
			log.debug(e);			 
		} catch (JSONException e) {			
			log.debug(e);						
			throw new RuntimeException(e);
		}
	}
	
	public static DataSource getSourceByPrototype(Scriptable prototype) {
		if(prototype instanceof PersistableClass)
			return DataSourceManager.getMetaClassSource();

		for (Entry<DataSource, SourceInfo> entry : sourceInfo.entrySet()) {
			if (prototype == entry.getValue().schema.getPrototypeProperty())
				return entry.getKey();
		}
		return null;
	}

	/**
	 * Determines the corresponding Java class for the given data source and
	 * returns the source info object that holds the class
	 * 
	 * @param source
	 * @return
	 */
	public static SourceInfo getObjectsClass(DataSource source) {
		SourceInfo info = sourceInfo.get(source);

		if (info.objectsClass == null) {
			if (info.objectsClassName != null) {
				try {
					info.objectsClass = (Class<? extends Persistable>) Class.forName(info.objectsClassName);
				} catch (ClassNotFoundException e) {
					throw new RuntimeException(e);
				}
			}
		}

		return info;
	}

	static class SchemaTester implements PersistableInitializer {
		public boolean foundSchema;

		public void finished() {
		}

		public void setVersion(Version version) {
		}
		public void setLastModified(Date lastModified) {
		}

		public Persistable getInitializingObject() {
			return null;
		}

		public void initializeList(Collection sourceCollection) {
		}

		public void setAcl(Acl acl) {
		}

		public void setCacheLevel(long time) {
		}

		public void setParent(ObjectId objectToInheritFrom) {
		}

		public void setPersistentAcl(ObjectId aclId) {
		}

		public void setProperty(String name, Object value) {
			if ("schema".equals(name)) {
				foundSchema = true;
			}
		}

		public void setProperty(String name, Object value, int attributes) {
			if ("schema".equals(name)) {
				foundSchema = true;
			}
		}

	}

	/**
	 * initializes a data source
	 * 
	 * @param dataSourceElement
	 * @param configId
	 * @param schema
	 * @return
	 * @throws Exception
	 */
	public static DataSource initSource(Map dataSourceElement, String configId, PersistableClass schema, String readOnlyData) throws Exception {
		// much bootstrapping madness is contained in this method
		if(dataSourceElement.get("name") != null && !(dataSourceElement.get("name") instanceof String))
			throw new RuntimeException("The name property for a data source configuration must be a string");
		String name = (String) dataSourceElement.get("name");
		
		if(dataSourceElement.get("sourceClass") != null && !(dataSourceElement.get("sourceClass") instanceof String))
			throw new RuntimeException("The sourceClass property for a data source configuration must be a string or omitted");
		String sourceClass = (String) dataSourceElement.get("sourceClass");
		if(sourceClass == null && schema != null && schema.get("sourceClass") instanceof String){
			sourceClass = (String) schema.get("sourceClass");
		}
		if(sourceClass == null && schema == null && dataSourceElement.get("schema") instanceof Map && ((Map)dataSourceElement.get("schema")).get("sourceClass") instanceof String){
			sourceClass = (String) ((Map)dataSourceElement.get("schema")).get("sourceClass");
		}
		DataSource source;
		if ("Class".equals(name))
			source = metaClassSource;
		else{
			if(dataSources.get(name) != null)
				throw new RuntimeException("Duplicate table name " + name);
			source = ((Class<DataSource>) (Class.forName(sourceClass == null ? defaultSourceClass : sourceClass))).newInstance();
		}
		source.setId(name);
		source.initParameters(dataSourceElement);		
		dataSources.put(name, source);
		SourceInfo info = new SourceInfo();
		boolean visible = true;
		Scriptable global = GlobalData.getGlobalScope();
		visible = !Boolean.TRUE.equals(dataSourceElement.get("hidden"));
		if (visible)
			dataSourcesVisible.add(name);

		if(configId != null){
			if(readOnlyData != null && configSource != null)
				((LocalJsonFileSource)configSource).setLocalReadOnlyData(configId, readOnlyData);
			SchemaTester tester = new SchemaTester();
			if (configSource != null) {
				configSource.mapObject(tester, configId);
	
				if (!tester.foundSchema) {
					PersistableClass.nextRealObject = (PersistableObject) ObjectId.idForObject(configSource,
							configId + LocalJsonFileSource.pathSeparator + "schema", true).getOrCreateTarget();
					ObjectId.idForObject(configSource, configId, true).getTarget().set("schema",
							ObjectId.idForObject(configSource, configId + LocalJsonFileSource.pathSeparator + "schema", true));
				}
			}
			if ("config".equals(name)) {
				configSource = (WritableDataSource) source;
				if(readOnlyData != null)
					((LocalJsonFileSource)configSource).setLocalReadOnlyData(configId, readOnlyData);
			}
			metaClassSource.addSourceConfigObject((String) dataSourceElement.get("name"), ObjectId.idForObject(configSource, configId
					+ LocalJsonFileSource.pathSeparator + "schema", true));
	
			if ("Object".equals(name)) {
				baseObjectSource = (WritableDataSource) source;
				info.schema = new PersistableClass();
				info.schema.setPrototypeProperty((Scriptable) // temporarily do this so we can have a prototype for the time being
						ScriptableObject.getObjectPrototype(global));
				sourceInfo.put(source, info);
			}
			if ("config".equals(name)) {
				configSource = (WritableDataSource) source;
				PersistableClass.nextRealObject = new PersistableObject();
				info.schema = new PersistableClass();
				info.schema.setPrototypeProperty(Persevere.newObject());
				sourceInfo.put(source, info);
				SourceInfo rootInfo = sourceInfo.get(metaClassSource);
				PersistableClass.nextRealObject = new PersistableObject();
				rootInfo.schema = new PersistableClass();//temporary
				rootInfo.schema.setPrototypeProperty(Persevere.newObject()); // temporarily do this so we can have a prototype for the time being
				info.schema = (PersistableClass) ObjectId.idForObject(metaClassSource, "config").getTarget();// now give the Object source the correct schema/protoype
				info.schema.setPrototypeProperty(Persevere.newObject());
			}
			if ("Class".equals(name)) {
				SourceInfo rootInfo = sourceInfo.get(metaClassSource);
				PersistableClass classClass = (PersistableClass) ObjectId.idForObject(metaClassSource, "Class").getTarget(); //give the root schema the right schema
				rootInfo.schema = classClass;
				classClass.schema = classClass;
			}
			info.objectsClassName = (String) dataSourceElement.get("objectsClass");
			if ("".equals(info.objectsClassName))
				info.objectsClassName = null;
			PersistableClass.nextRealObject = (PersistableObject) ObjectId.idForObject(configSource,
					configId + LocalJsonFileSource.pathSeparator + "schema", true).getOrCreateTarget();
			info.schema = (PersistableClass) ObjectId.idForObject(metaClassSource, name).getTarget();
			info.schema.setRealObject((PersistableObject) ObjectId.idForObject(configSource, configId + LocalJsonFileSource.pathSeparator + "schema",
					true).getOrCreateTarget());
			if ("Object".equals(name)) {
				info.schema.setPrototypeProperty((Scriptable) // temporarily do this so we can have a prototype for the time being
						ScriptableObject.getObjectPrototype(global));
				// hook up Class/Class to have the right prototype
				ObjectId.idForObject(metaClassSource, "Class").getTarget().setPrototype(info.schema);
				global.put("Object", global, info.schema);
				PersistableClass.Object = info.schema;
			}
		}
		else {
			info.objectsClassName = (String) dataSourceElement.get("objectsClass");
			info.schema = schema;
		}
		sourceInfo.put(source, info);
		SourceInfo rootInfo = sourceInfo.get(metaClassSource);
		if ("Array".equals(name)) {
			info.schema.setPrototypeProperty(// temporarily do this so we can have a prototype for the time being
					ScriptableObject.getClassPrototype(global, "Array"));
			global.put("Array", global, info.schema);
			PersistableClass.Array = info.schema;
			RestMethod.setRestMethods(global);

		}
		/*
		 * if ("Function".equals(name)) { info.schema.setPrototypeProperty(//
		 * temporarily do this so we can have a prototype for the time being
		 * ScriptableObject.getFunctionPrototype(global)); }
		 */
		if (visible) {
			//rootInfo.schema.initializeProperty(name, info.schema);
			((ProtectedGlobal) global).putClass(name, global, info.schema);
		}
		
		info.schema.getPrototypeProperty(); // must force each one to have a prototype
		if(baseObjectSource != null && !"Object".equals(name)){
			info.schema.setPrototype(ObjectId.idForObject(metaClassSource, "Object").getTarget());
		}
		PersistableClass.nextRealObject = null; // don't want to confuse the next one
		return source;
	}

	static Map loadConfig() throws Exception {
		File configFile = new File(configDirectory.getAbsolutePath() + File.separatorChar + AUTO_GENERATED_SOURCE_CONFIG_FILE);
		Map config;
		if (configFile.exists()) {
			String configurationFile = IOUtils.toString(new FileInputStream(configFile));
			configurationFile = configurationFile.replaceAll("\\$DATA-DIR\\$", webInfPath + "/data");
			config = (Map) JSON.parse(configurationFile);
		} else
			config = new HashMap();
		if (config.get("sources") == null) {
			config.put("sources", new ArrayList());
		}
		return config;
	}

	/**
	 * create a new data source, adding it to the generated config file
	 * 
	 * @param name
	 * @param superType
	 * @param schema
	 * @return
	 * @throws Exception
	 */
	public static DataSource createNewSource(String name, String superType, PersistableClass schema) throws Exception {
		
		Map config = loadConfig();
		Map dataSourceElement = new LinkedHashMap();
		dataSourceElement.put("name", name);
		Map<String, Object> settings = new HashMap<String, Object>();
		
		for (Entry<String, Object> entry : settings.entrySet()) {
			dataSourceElement.put(entry.getKey(), entry.getValue());
		}
		List dataSourceConfigs = (List) config.get("sources");
		dataSourceConfigs.add(dataSourceElement);
		saveConfig(config);
		ObjectId idForSourceDefinition = ObjectId.idForObject(configSource, AUTO_GENERATED_SOURCE_CONFIG_FILE + LocalJsonFileSource.pathSeparator
				+ "sources", true);
		((AbstractJsonSource)idForSourceDefinition.source).clearCache();
		idForSourceDefinition.targetRef = null; // force a reload
		Transaction.addAffectedSource((WritableDataSource) idForSourceDefinition.source);
		((LocalJsonFileSource) idForSourceDefinition.source).makeDirty(idForSourceDefinition.subObjectId);
		String configId = AUTO_GENERATED_SOURCE_CONFIG_FILE + LocalJsonFileSource.pathSeparator + "sources"
			+ LocalJsonFileSource.pathSeparator + (dataSourceConfigs.size() - 1);
		DataSource newSource = initSource(dataSourceElement, configId , schema, null);
		// must make the object look dirty
		ObjectId.idForObject((WritableDataSource) idForSourceDefinition.source, configId, true).getTarget().set("schema",null);
		ObjectId.idForObject((WritableDataSource) idForSourceDefinition.source, configId, true).getTarget().set("schema",
				ObjectId.idForObject((WritableDataSource) idForSourceDefinition.source, configId  + LocalJsonFileSource.pathSeparator + "schema", true).getTarget());
		return newSource;
	}

	/*
	 * public static void modifySource(DataSource source) throws Exception{ Map
	 * config = loadConfig(); List dataSourceConfigs = config.get("sources");
	 * Map dataSourceElement = null; for (int i =0; i <
	 * dataSourceConfigs.length(); i++) { dataSourceElement =
	 * dataSourceConfigs.getMap(i); if
	 * (name.equals(dataSourceElement.get("name"))) { break; } } for (Entry<String,Object>
	 * entry : settings.entrySet()) {
	 * dataSourceElement.put(entry.getKey(),entry.getValue()); }
	 * saveConfig(config); }
	 */

	public static void deleteSource(String name) throws Exception {
		Map config = loadConfig();
		DataSource deletingSource = getSource(name);
		if (deletingSource instanceof SourceDeleteAware)
			((SourceDeleteAware) deletingSource).onDelete();
		List dataSourceConfigs = (List) config.get("sources");
		List newDataSourceConfigs = new ArrayList();
		for (int i = 0; i < dataSourceConfigs.size(); i++) {
			Map dataSourceElement = (Map) dataSourceConfigs.get(i);
			if (!name.equals(dataSourceElement.get("name"))) {
				newDataSourceConfigs.add(dataSourceElement);
			}
		}
		config.put("sources", newDataSourceConfigs);
		saveConfig(config);
		dataSources.remove(name);
		dataSourcesVisible.remove(name);
		ObjectId.onDeleteSource(deletingSource);
	}

	static void saveConfig(Map config) throws Exception {
		try {
			byte[] newConfig = JSON.serialize(config).getBytes();
			FileOutputStream fos = new FileOutputStream(new File(configDirectory.getAbsolutePath() + File.separatorChar
					+ AUTO_GENERATED_SOURCE_CONFIG_FILE));
			fos.write(newConfig);
			fos.close();
		} catch (RuntimeException e) {
			throw new RuntimeException("Trying to resave config file ", e);
		}
	}
		
	public static DataSource getMetaClassSource() {
		return metaClassSource;
	}

	public static Persistable getRootObject() {
		return ObjectId.idForObject(metaClassSource, "Class").getTarget();
	}

	public static DataSource getSource(String nameSpace) {
		if (nameSpace == null)
			return getMetaClassSource();
		return dataSources.get(nameSpace);
	}

	@Deprecated
	public static Persistable getById(String id) {
		return ObjectId.idForString(id).getTarget();
	}

	public static void purgeAllOrphans() {
		for (DataSource source : dataSources.values()) {
			if (source instanceof DataSourceCanHaveOrphans)
				((DataSourceCanHaveOrphans) source).purgeOrphans();
		}
	}
		
    /**
    * The method iterates through the list of datasource that implement DestroyAwareDataSource and calls the destroy method.
    * The method is used to provide a clean-up opportunity to data sources that need to free resources.  Normally, this method is
    * intended to be called when Persevere is being shut down.   
    */
	public static void destroy() {
		for (DataSource source : dataSources.values()) {
			if (source instanceof DestroyAwareDataSource) {				
				((DestroyAwareDataSource) source).destroy();				
			}
		}	
	}
	
	
	
	

	public static Set<String> getDataSourceNames() {
		return dataSourcesVisible;
	}

	public static Map<String, DataSource> getDataSources() {
		return dataSources;
	}

}
