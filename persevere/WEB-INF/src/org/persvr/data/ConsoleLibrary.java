package org.persvr.data;

import java.util.logging.ConsoleHandler;
import java.util.logging.Formatter;
import java.util.logging.Handler;
import java.util.logging.LogRecord;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.commons.logging.impl.Jdk14Logger;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.persvr.javascript.PersevereNativeFunction;

/**
 * Implementation of basic console functionality as defined by Firebug and JS libraries 
 * 
 * @author Kris Zyp
 */
public class ConsoleLibrary extends NativeObject {
	public String getClassName() {
		return "Console";
	}
	Log log = LogFactory.getLog(ConsoleLibrary.class);
	public void set(String name, Object value){
		put(name,this,value);
	}
	public ConsoleLibrary() {
		super();
		if(log instanceof Jdk14Logger){
			final ConsoleHandler handler = new ConsoleHandler();
			((Jdk14Logger)log).getLogger().addHandler(handler);
			((Jdk14Logger)log).getLogger().setUseParentHandlers(false);
			handler.setFormatter(new Formatter(){
				public String format(LogRecord record){
					return record.getLevel() + ": " + record.getMessage() + '\n';
				}
			});
		}
		set("log", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				String output = "";
				for(Object arg : args){
					output += arg + " ";					
				}
				log.info(output);
				return null;
			}
			
		});
		set("warn", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				String output = "";
				for(Object arg : args){
					output += arg + " ";
				}
				log.warn(output);
				return null;
			}
			
		});
		set("debug", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				String output = "";
				for(Object arg : args){
					output += arg + " ";
				}
				log.debug(output);
				return null;
			}
			
		});
		set("error", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				String output = "";
				for(Object arg : args){
					output += arg + " ";
				}
				log.error(output);
				return null;
			}
			
		});
		set("info", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				String output = "";
				for(Object arg : args){
					output += arg + " ";
				}
				log.info(output);
				return null;
			}
			
		});
		set("fatal", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				String output = "";
				for(Object arg : args){
					output += arg + " ";
				}
				log.fatal(output);
				return null;
			}
			
		});
	}
}
