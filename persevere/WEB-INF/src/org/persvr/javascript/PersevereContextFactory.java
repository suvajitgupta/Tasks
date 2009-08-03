package org.persvr.javascript;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.ErrorReporter;
import org.mozilla.javascript.EvaluatorException;
import org.persvr.data.ConsoleLibrary;
/**
 * Creates Rhino context objects, one for each thread, with the preferred features of Persevere
 * @author Kris
 *
 */
public class PersevereContextFactory extends ContextFactory {
	private PersevereContextFactory(){
	}
	static{
		initGlobal(new PersevereContextFactory()); 
	}
	@Override
	protected boolean hasFeature(Context cx, int featureIndex) {
        switch (featureIndex) {
          case Context.FEATURE_PARENT_PROTO_PROPERTIES:
    	  	return false;

          case Context.FEATURE_STRICT_EVAL:
        	  return true;
        	  
          case Context.FEATURE_RESERVED_KEYWORD_AS_IDENTIFIER:
        	  return true;
          
        }
        return super.hasFeature(cx, featureIndex);
    }
	static ThreadLocal<Context> contexts = new ThreadLocal<Context>();
	static Log log = LogFactory.getLog(ConsoleLibrary.class);

	static class StErrErrorReporter implements ErrorReporter {
		ErrorReporter defaultReporter;
		StErrErrorReporter(ErrorReporter defaultReporter) {
			this.defaultReporter = defaultReporter;
		}
		public void error(String message, String sourceName, int line, String lineSource, int lineOffset) {
			defaultReporter.error(message, sourceName, line, lineSource, lineOffset);
		}

		public EvaluatorException runtimeError(String message, String sourceName, int line, String lineSource, int lineOffset) {
			return defaultReporter.runtimeError(message, sourceName, line, lineSource, lineOffset);
		}

		public void warning(String message, String sourceName, int line, String lineSource, int lineOffset) {
			log.warn("message: " + message + " source: " + sourceName + " #" + line + ":" + lineOffset + "\n" + lineSource);
		}
		
	}
	public static Context getContext(){
		Context context = contexts.get();
		if (context == null){
			context = getGlobal().enterContext();
			context.getWrapFactory().setJavaPrimitiveWrap(false);
			context.setOptimizationLevel(9); // make it as fast as possible
			context.setLanguageVersion(Context.VERSION_1_7); // Run JavaScript 1.7
			// TODO: Could save a few bytes of memory by caching this in a static to be shared by all threads
			context.setErrorReporter(new StErrErrorReporter(context.getErrorReporter()));
			contexts.set(context);
		}
		return context;
	}
}
