package org.persvr.util;

import java.util.Comparator;
import java.util.Date;

import org.mozilla.javascript.Undefined;
import org.persvr.data.ObjectId;
import org.persvr.data.Persistable;
/**
 * Provides a default comparator of values. This is different than JavaScript's
 * default comparison, as it is transitive (JS is not, for example "5" < 44, 44 < "333", but "5" > "333")
 * this also is case-insensitive (who ever really wants case-sensitive sorting, plus doing case-sensitive sorting on a case-insensitive list can be done in O(n) time and O(1) memory
 * and handles various types including dates and objects  
 * @author Kris
 *
 */
public class CompareValues implements Comparator<Object>{
	public final static CompareValues instance = new CompareValues();
	private CompareValues(){
	}
	private static int typeRank(Object obj){
		if(obj instanceof Number)
			return 3;
		if(obj instanceof String)
			return 4;
		if(obj instanceof Boolean)
			return 2;
		if(obj instanceof Date)
			return 5;
		if(obj instanceof Persistable)
			return 6;
		if(obj instanceof ObjectId)
			return 6;
		if(obj == null)
			return 0;
		if(obj == BIGGEST)
			return 100;
		if(obj == Undefined.instance)
			return -1;
		return 1;
	}
	public final static Object BIGGEST = new Object();
	public int compare(Object v1, Object v2) {
		int i1 = typeRank(v1);
		int i2 = typeRank(v2);
		if(i1!=i2)
			return i1>i2 ? 1 : -1;
		if(v1 instanceof Number)
			return ((Number)v1).doubleValue()>((Number)v2).doubleValue() ? 1 : ((Number)v1).doubleValue() == ((Number)v2).doubleValue() ? 0 : -1;
		if(v1 instanceof String) {
			int comparison = ((String)v1).compareToIgnoreCase((String)v2);
			return comparison == 0 ? ((String)v1).compareTo((String)v2) : comparison; // break ties with case sensitive
		}
		if(v1 instanceof Boolean)
			return v1.equals(v2) ? 0 : ((Boolean)v1) ? 1 : -1;
		if(v1 instanceof Date)
			return ((Date)v1).getTime()> ((Date)v2).getTime() ? 1 : ((Date)v1).getTime() == ((Date)v2).getTime() ? 0 : -1;
		if(v1 instanceof Persistable)
			v1 = ((Persistable)v1).getId();
		if(v2 instanceof Persistable)
			v2 = ((Persistable)v2).getId();
		if(v1 instanceof ObjectId)
			return v1.toString().compareToIgnoreCase(v2.toString());
		return 0;
	}

}
