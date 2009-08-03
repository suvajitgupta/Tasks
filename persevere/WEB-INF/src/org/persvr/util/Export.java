package org.persvr.util;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.mozilla.javascript.Scriptable;
import org.persvr.data.DataSourceManager;
import org.persvr.data.GlobalData;
import org.persvr.data.ObjectId;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableList;
import org.persvr.datasource.DataSource;
import org.persvr.javascript.PersevereContextFactory;

public class Export {
	public static String EXPORT_FILE = "C:\\temp\\DataUpgrade.0.8.0.json";
	public static void main(String[] args) {
		try {
			if (args.length > 0)
			EXPORT_FILE = args[0];
			Export export = new Export();
			export.out = new FileOutputStream(EXPORT_FILE); 
			export.oldSource = DataSourceManager.getSource("old");
			export.newSource = DataSourceManager.getSource("dyna");
			export.write("{source:\"http://www.xucia.com/page/Persevere\",data:[");
			export.excludedObjects.add((Persistable)DataSourceManager.getById("dyna/1698"));
			export.excludedObjects.add((Persistable)DataSourceManager.getById("dyna/1694"));
			export.excludedObjects.add((Persistable)DataSourceManager.getById("dyna/1747"));
			export.excludedObjects.add((Persistable)DataSourceManager.getById("dyna/1703"));
			export.excludedObjects.add((Persistable)DataSourceManager.getById("dyna/1706"));
			export.excludedObjects.add((Persistable)DataSourceManager.getById("dyna/1708"));
			//export.excludedObjects.add((DataObject)DataSourceManager.getRootObject().getById(new Id("226")));
			export.excludedObjects.add((Persistable)DataSourceManager.getById("dyna/1709"));
			export.excludedObjects.add((Persistable)DataSourceManager.getById("dyna/3"));
			export.topLevelObjects.add((Persistable)DataSourceManager.getRootObject());
			while(!export.topLevelObjects.isEmpty()) {
				Persistable objectToExport = export.topLevelObjects.iterator().next();
				export.export(objectToExport,false);
				export.topLevelObjects.remove(objectToExport);
			}
			export.write("{}]}");
			export.out.close();
			System.err.println("Finished export to " + EXPORT_FILE);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	DataSource oldSource ;
	DataSource newSource ;
	FileOutputStream out;
	Set<Persistable> excludedObjects = new HashSet(); // won't even write the field for these
	Set<Persistable> visitedObjects = new HashSet();
	Set<Persistable> topLevelObjects = new HashSet();
	StringBuffer sb = new StringBuffer();
	private void write(String string) throws IOException {
		out.write(string.getBytes());
		sb.append(string);
	}
	private boolean compareValues(Object oldValue, Object value) {
		boolean same = false;
		if (value instanceof Persistable) {
			if (oldValue instanceof Persistable)
				if (((Persistable)value).getId().subObjectId.equals(((Persistable)oldValue).getId().subObjectId)) 
					same = true;
		}
		else if (value == null) {
			same = oldValue == null;
		}
		else if (value == Scriptable.NOT_FOUND) // TODO: Make this do deletion if the old value does exist
			same = true;
		else if (value.equals(oldValue))
			same = true;
		return same;
	}
	private void writeValue(Object value) throws IOException {
		if (value instanceof String)
			write(encode((String) value));
		else if (value instanceof Persistable) 
			export((Persistable)value,true);
		else if (value instanceof Number || value instanceof Boolean)
			write(value.toString());
		else if (value instanceof Date)
			write("\"date:" + ((Date) value).getTime() + "\"");
		else if (value instanceof Scriptable && value.getClass().getName().indexOf("NativeDate") > 0)
			write("\"date:" + ((Number)PersevereContextFactory.getContext().evaluateString((Scriptable) value, "getTime()", "getTime", 0, null)).longValue() + "\"");
		else if (value == null)
			write("null");
		else 
			throw new RuntimeException("Unhandled object " + value);
	}
    private static StringEncoder javascriptStringEncoder = new StringEncoder();
    static {
        javascriptStringEncoder.setUnsafeStrings(new String[] {"\\\"","\\n","\\r"}, new String[] {"\\\\\"","\\\\n","\\\\r"});
    }
    public static String encode(String string) {
    	return JSON.quote(string);
    }

    private void export(Persistable newObject,boolean mustWriteId) throws IOException{

    	boolean identified = false;
    	if (mustWriteId) {
			write("\n{\"id\":\"" + newObject.getId().toString(newSource,null) +"\"");
			identified = true;
    	}
    	
    	//if (newObject.getId().toString().equals("284"))
    		//System.err.println(newObject.getId());
    	if (!visitedObjects.contains(newObject) && newObject.getId().getSource() == newSource) {
	    	visitedObjects.add(newObject);
	    	Persistable oldObject = (Persistable) ObjectId.idForObject(oldSource,newObject.getId().subObjectId).getTarget(); 
	    	for (Map.Entry<String,Object> entry: newObject.entrySet(0)) {
	    		String key = entry.getKey();
	    		Object value = entry.getValue();
	    		if (!key.equals(":importMaps") 
	    				&& !key.equals("history") 
	    				&& !key.equals("version") 
	    				//&& !key.equals(GlobalData.IN_GROUPS_FIELD) 
	    				&& !compareValues(oldObject.get(key),value)
	    				&& !excludedObjects.contains(value)) {
	    			if (!identified) {
	    				write("\n{\"id\":\"" + newObject.getId().toString(newSource,null) + "\"");
	    				identified = true;
	    			}	    			
	    			write("," + encode(key) + ":");
	    			writeValue(value);
	    		}
	    	}
	    	for (Map.Entry<String,Object> entry: newObject.entrySet(0)) {
	    		String key = entry.getKey();
	    		Object value = entry.getValue();
	    		if (value instanceof Persistable && !excludedObjects.contains(value) && !key.equals("history")) 
	    				//&& !key.equals(GlobalData.IN_GROUPS_FIELD))
	    			topLevelObjects.add((Persistable) value);
	    	}
    	
	    	if (newObject instanceof List) {
	        	boolean newListNeeded = false;
	    		if (oldObject instanceof List) {    	
		    		int i = 0;
	    			try {
			    		for (Object value : (PersistableList) newObject) {
			    			if (!compareValues(((PersistableList) oldObject).get(i++),value) && !excludedObjects.contains(value)) {
			    				newListNeeded = true;
			    				break;
			    			}
			    		}
	    			} catch (IndexOutOfBoundsException e) {
	    				newListNeeded = true;
	    			}
	    		}
	    		else
	    			newListNeeded = true;
	    		if (newListNeeded) {
	    			if (!identified) {
	    				write("\n{\"id\":\"" + newObject.getId().toString(newSource,null) + "\"");
	    				identified = true;
	    			}	    
	    			write(",\"array\":[");
	    			boolean first = true;
		    		for (Object value : (PersistableList) newObject) {
		    			if (!excludedObjects.contains(value)) {
			    			if (first)
			    				first = false;
			    			else
			    				write(",");
			    			writeValue(value);
		    			}
		    		}
		    		write("]");
	    		}
	    		for (Object value : (PersistableList) newObject) {
		    		if (value instanceof Persistable && !excludedObjects.contains(value))
		    			topLevelObjects.add((Persistable) value);
	    		}
	    	}
    	}
    	else {
			if (identified && newObject instanceof List)
				write(",\"array\":0");
    		
    	}
    	if (identified) {
    		write("}");
    		if (!mustWriteId)
    			write(",");
    	}
    	
    }

}
