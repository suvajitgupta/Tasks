package org.persvr.datasource;

import java.io.File;
import java.io.FileFilter;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import org.mozilla.javascript.Scriptable;
import org.persvr.data.DataSourceManager;
import org.persvr.data.GlobalData;
import org.persvr.data.LazyPropertyId;
import org.persvr.data.ObjectId;
import org.persvr.data.ObjectNotFoundException;
import org.persvr.data.Persistable;
import org.persvr.data.Query;
import org.persvr.remote.PersevereFilter.LocalDataSource;
import org.persvr.util.JSON;

public class LocalJsonFileSource extends AbstractJsonSource implements LocalDataSource, WritableDataSource, ChangeableData {
	Map<String,String> localReadOnlyData = new HashMap();
	public boolean doesObjectNeedUpdating(String objectId){
		Scriptable global = GlobalData.getGlobalScope();
		if(Boolean.TRUE.equals(global.get("monitorConfigFiles", global))){
			String[] paths = objectId.split(getPathSeparator());
			String resourceName = paths[0];
			if(localReadOnlyData.get(resourceName) != null)
				return false;
			File resourceFile = new File(localPath + File.separatorChar + resourceName);
			Long time = objectModifiedDate.get(objectId);
			if (time == null)
				return false;
			return time < resourceFile.lastModified();
		}
		return false;
	}
	public void setLocalReadOnlyData(String resource, String body){
		localReadOnlyData.put(resource.split(pathSeparator)[0], body);
	}
	Map<String,Long> objectModifiedDate = new HashMap();
	public void recordDelete(String objectId) throws Exception {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	public NewObjectPersister recordNewObject(Persistable object) throws Exception {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	public static final String LOCAL_JSPON_RELATIVE_PATH = "";
	private static String localJsonPath = "";
	protected String localPath;
	public static void setLocalJsonPath(String localJsonPath) {
		LocalJsonFileSource.localJsonPath = localJsonPath;
	}
	boolean useIds(){
		return false;
	}
	Map<String,Object> dirtyJson = new HashMap();
	@Override
	protected Object getJson(String resourceName) throws Exception {
		String asString = localReadOnlyData.get(resourceName);
		if(asString != null)
			return JSON.parse(asString);
		//TODO: Move the regex out to a constant Pattern
		if (resourceName.matches("((^|\\\\|/)\\w[\\w\\._\\- ]+)+")){
			Object json = dirtyJson.get(resourceName);
			if (json == null){
				//Logger.getLogger(LocalJsonFileSource.class.toString()).info("Reading local json file " + localPath + File.separatorChar + resourceName);
				try {
					File resourceFile = new File(localPath + File.separatorChar + resourceName);
					FileInputStream fis = new FileInputStream(resourceFile);
					json = JSON.parse(getResourceAsString(fis));
					fis.close();
				} catch (FileNotFoundException e) {
					throw new ObjectNotFoundException(this,resourceName);
				}
			}
			return json;
		}
		throw new RuntimeException("Illegal character in filename");
	}
	protected void setJson(String resourceName, String json) throws Exception {
		String asString = localReadOnlyData.get(resourceName);
		if(asString != null){
			if("generated.js".equals(resourceName)) {
				Logger.getLogger(LocalJsonFileSource.class.toString()).info("Can not modify configuration file when it is located in core server directory. You probably need to delete the generated.js file in persevere/WEB-INF/config");
				return;
			}
//			Logger.getLogger(LocalJsonFileSource.class.toString()).info("Can not modify reaonly configuration file " + resourceName + " from core server directory WEB-INF/config.");
			return;
		}
		if (resourceName.matches("((^|\\\\|/)\\w[\\w\\._\\- ]+)+")){
			File resourceFile = new File(localPath + File.separatorChar + resourceName);
			FileOutputStream fos = new FileOutputStream(resourceFile);
			fos.write(json.getBytes());
			cachedJson.remove(resourceName);
			fos.close();
		}
		else
			throw new RuntimeException("Illegal character in filename");
	}
	public static final String pathSeparator = "\udeaf"; // use a bizarre character here to avoid collisions 
	public String getPathSeparator(){
		return pathSeparator;
	}
	protected Object mapJson(PersistableInitializer initializer, final Object object, final String objectId)  {
		String[] paths = objectId.split(getPathSeparator());
		String resourceName = paths[0];
		File resourceFile = new File(localPath + File.separatorChar + resourceName);
		objectModifiedDate.put(objectId, resourceFile.lastModified());
		int lastSeparator = objectId.lastIndexOf(pathSeparator);
		if (lastSeparator > -1)
			initializer.setParent(ObjectId.idForObject(this, objectId.substring(0,lastSeparator), true));
		return super.mapJson(initializer, object, objectId);
	}
	public Object getFieldValue(LazyPropertyId valueId) throws Exception {
		// TODO Auto-generated method stub
		return null;
	}
	public LocalJsonFileSource() {
		defaultCacheLength = 100;
	}
	boolean passThrough = false;
	public void initParameters(Map<String,Object> parameters) {
		String local = (String) parameters.get("localPath");
		if (local == null || "".equals(local)){
			localPath = DataSourceManager.configDirectory.getAbsolutePath();
		}
		else{
			if (local.equals(getId())){
				passThrough = true;
			}
			localPath = localJsonPath + File.separatorChar + local;
		}
	}
	public boolean passThrough(){
		return passThrough;
	}
	public Collection<Object> query(Query query) throws Exception {
		final File[] files = new File(localPath).listFiles(new FileFilter(){
			public boolean accept(File file){
				return file.getName().toLowerCase().indexOf(".js") > -1;
			}
		});
		List fileList = new ArrayList();
		for(File file: files){
			fileList.add(ObjectId.idForObject(LocalJsonFileSource.this, file.getName(), true));
		}
		return fileList;
	}
	@Override
	protected void newJson(String json) throws Exception {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	@Override
	public boolean isTrusted() {
		return true;
	}

}
