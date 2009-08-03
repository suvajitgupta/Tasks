package org.persvr.data;

import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.RuntimeMXBean;
import java.lang.management.ThreadMXBean;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.persvr.Persevere;
import org.persvr.data.Method.Timing;
import org.persvr.remote.AliasIds;
import org.persvr.remote.EventStream;
import org.persvr.security.PermissionLevel;
import org.persvr.security.SystemPermission;
import org.persvr.security.UserSecurity;

public class Status extends ReadonlyObject{
	private Status() {
		setPrototype(ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(),"Object"));
	}
	ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
	OperatingSystemMXBean operatingSystemMXBean = ManagementFactory.getOperatingSystemMXBean();
	MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
	RuntimeMXBean runtimeMXBean = ManagementFactory.getRuntimeMXBean();
	List<GarbageCollectorMXBean> gcMXBeans = ManagementFactory.getGarbageCollectorMXBeans();
	public static void initialize(){
		Scriptable global = GlobalData.getGlobalScope();
		global.put("status", global, instance);
	}
	static long startTime = new Date().getTime();
	static long totalRequestTime;
	static long requestCount;
	static double runningAverageRequestTime;
	static double maxRequestTime;
	public static void addRequestTiming(long time){
		totalRequestTime += time;
		requestCount++;
		runningAverageRequestTime = (runningAverageRequestTime * 9 + time) / 10;
		maxRequestTime = Math.max(maxRequestTime, time);
	}
	public static Status instance = new Status(); 
	public Object get(String key) {
		if(PersistableObject.securityEnabled.get() != null){
			if(!UserSecurity.hasPermission(SystemPermission.accessStatus)){
				throw ScriptRuntime.constructError("AccessError", "You do not have access to the status object");
			}
			PersistableObject.checkSecurity(this, PermissionLevel.READ_LEVEL.level);
		}
		Runtime runtime = Runtime.getRuntime();
		if ("freeMemory".equals(key))
			return runtime.freeMemory();
		if ("references".equals(key))
			return DataSourceManager.softReferences ? "soft" : "weak";
		if ("totalMemory".equals(key))
			return runtime.totalMemory();
		if ("maxMemory".equals(key))
			return runtime.maxMemory();
		if ("version".equals(key))
			return Persevere.getPersevereVersion();
		if ("availableProcessors".equals(key))
			return runtime.availableProcessors();
		if ("uptime".equals(key))
			return (new Date().getTime() - startTime) / 1000;
		if ("requests".equals(key))
			return requestCount;
		if ("averageRequestTime".equals(key))
			return requestCount == 0 ? 0 : ((double)totalRequestTime) / requestCount;
		if ("recentAverageRequestTime".equals(key))
			return runningAverageRequestTime;
		if ("maxRequestTime".equals(key))
			return maxRequestTime;
		long cpuTime = 0;
		long userTime = 0;
		int threadCount = 0;
		for(long threadId : threadMXBean.getAllThreadIds()){
			threadCount++;
			cpuTime += threadMXBean.getThreadCpuTime(threadId);
			userTime += threadMXBean.getThreadUserTime(threadId);
		}
		if ("threadCount".equals(key))
			return threadCount;
		if ("methodTimings".equals(key)) {
			List timingsObject = new PersistableArray(0);
			if(Method.timings != null)
				for(Map.Entry<Method, Timing> entry : Method.timings.entrySet()){
					Timing timing = entry.getValue();
					Persistable timingObject = new PersistableObject();
					timingObject.put("own", timingObject, timing.own/1000000000.0);
					timingObject.put("total", timingObject, timing.total/1000000000.0);
					timingObject.put("max", timingObject, timing.max/1000000000.0);
					timingObject.put("calls", timingObject, timing.calls);
					Method method = entry.getKey();
					timingObject.put("name", timingObject, method.className == null ? method.methodName : (method.className + '.' + method.methodName));
					timingsObject.add(timingObject);
				}
			return timingsObject;
		}
		if ("cpuTime".equals(key))
			return cpuTime / 1000000000.0;
		if ("userTime".equals(key))
			return userTime / 1000000000.0;		
		if ("heapMemoryUsage".equals(key))
			return memoryMXBean.getHeapMemoryUsage().getUsed();
		if ("nonHeapMemoryUsage".equals(key))
			return memoryMXBean.getNonHeapMemoryUsage().getUsed();
		if ("cometClients".equals(key))
			return EventStream.getConnectionCount();
		if ("clients".equals(key))
			return EventStream.streams.size();
		if ("vm".equals(key))
			return runtimeMXBean.getVmName() + " " + runtimeMXBean.getVmVendor() + " " + runtimeMXBean.getVmVersion();
		long gcTime = 0;
		for (GarbageCollectorMXBean gcMXBean : gcMXBeans){
			gcTime += gcMXBean.getCollectionTime();
		}
		if ("gcTime".equals(key))
			return gcTime / 1000.0;
		
		return Scriptable.NOT_FOUND;
	}

	public static AliasIds.AliasHandler statusAlias = new AliasIds.AliasHandler() {
		public Persistable getTarget() {
			return instance;
		}
	};
	public ObjectId getId() {
		return statusAlias;
	}

	public Persistable getParent() {
		return null;
	}

	Set<String> keys = new HashSet(Arrays.asList(
			new String[]{"freeMemory","totalMemory","maxMemory","availableProcessors",
					"uptime", "requests", "averageRequestTime", "recentAverageRequestTime",
					"threadCount", "cpuTime", "userTime", "version", "methodTimings","references","maxRequestTime",
					"heapMemoryUsage", "nonHeapMemoryUsage", "vm", "gcTime","cometClients", "clients"
					}));
	public Set<Map.Entry<String, Object>> entrySet(int options){
		Map map = new HashMap();
		for (String name : keys){
			map.put(name, get(name));
		}
		return map.entrySet();
	}


}
