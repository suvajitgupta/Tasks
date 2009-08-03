package org.persvr.remote;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;

import org.persvr.Persevere;
import org.persvr.data.ObjectId;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableObject;
import org.persvr.data.SMD;
import org.persvr.data.Status;
import org.persvr.security.UserSecurity;

/**
 * @author Kris Zyp
 *	This class provides a list of alias ids for the JSPON requests.  Not necessarily all alias Ids need to created by this class
 */
public class AliasIds {
	static Map<String,AliasHandler> aliasIds = new HashMap();
	public static AliasHandler getAliasHandler(String aliasId) {
		return aliasIds.get(aliasId);
	}
	public static abstract class AliasHandler extends ObjectId{
		@Override
		public abstract Persistable getTarget();
		@Override
		protected Persistable resolveTarget() {
			throw new RuntimeException("Should not be cached");
		}
		public String getField() {
			return null;
		}		
	}
	static void addMarkerAsAlias(final String markerName) {
		AliasHandler handler = new AliasHandler() {
			@Override
			public Persistable getTarget() {
				return AliasMarkerObject.markerObject(markerName);
			}
		};
		handler.subObjectId = markerName;
		aliasIds.put(markerName, handler);
	}
	static {
		aliasIds.put("user", new AliasHandler() {
			@Override
			public Persistable getTarget() {
				return (Persistable) UserSecurity.currentUser();
			}
		});
		AliasHandler rootHandler;
		aliasIds.put("root", rootHandler = new AliasHandler() {
			@Override
			public Persistable getTarget() {
				Persistable object = Persevere.newObject();
				for (Persistable table : ((List<Persistable>)ObjectId.idForString("Class/").getTarget()))
					object.put(table.getId().subObjectId, object, table);
				return object;
			}
		});
		aliasIds.put("SMD", SMD.smdAlias);
		SMD.smdAlias.subObjectId = "SMD";
		aliasIds.put("status", Status.statusAlias);
		Status.statusAlias.subObjectId = "status";
		//aliasIds.put("", rootHandler);
		String[] markerObjectsToAddAsAliases = new String[] {"persevereMethod"};
		for (String marker : markerObjectsToAddAsAliases)
			addMarkerAsAlias(marker);
	}
	static class AliasMarkerObject extends PersistableObject {
		@Override
		public String getClassName() {
			return "Alias";
		}

		static Map<String,AliasMarkerObject> markerAliases = new HashMap();
		String alias;
		static public AliasMarkerObject markerObject(String alias) {
			AliasMarkerObject markerObject;
			markerObject = markerAliases.get(alias);
			if (markerObject == null) {
				markerObject = new AliasMarkerObject(alias);
				markerAliases.put(alias, markerObject);
			}
			return markerObject;
		}
		private AliasMarkerObject(String alias) {
			this.alias = alias;
		}
		@Override
		public ObjectId getId() {
			return new ObjectId() {
				@Override
				public String toString() {
					return AliasMarkerObject.this.alias;
				}
			};
		}

		public void clear() {
		}

		public boolean containsKey(Object key) {
			return false;
		}

		public boolean containsValue(Object value) {
			return false;
		}

		public Set<Entry<String, Object>> entrySet() {
			return new HashSet();
		}

		public Object get(String key) {
			return null;
		}

		public boolean isEmpty() {
			return false;
		}

		public Set<String> keySet(boolean includeDontEnum) {
			return new HashSet();
		}

		public Object set(String name, Object value) {
			throw new UnsupportedOperationException("Not set on a alias marker object");
		}

		public void putAll(Map<? extends String, ? extends Object> t) {
			throw new UnsupportedOperationException("Not set on a alias marker object");
		}

		public void removeField(String key) {
			throw new UnsupportedOperationException("Not set on a alias marker object");
		}

		public int size() {
			return 0;
		}

		public Collection<Object> values() {
			// TODO Auto-generated method stub
			return null;
		}

		
	}
}
