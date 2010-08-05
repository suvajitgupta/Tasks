package org.persvr.remote;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.net.URLDecoder;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.FileItemFactory;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.persvr.Persevere;
import org.persvr.data.BinaryData;
import org.persvr.data.DataSourceManager;
import org.persvr.data.FunctionUtils;
import org.persvr.data.GlobalData;
import org.persvr.data.Identification;
import org.persvr.data.JsonPath;
import org.persvr.data.Method;
import org.persvr.data.ObjectNotFoundException;
import org.persvr.data.ObjectNotFoundId;
import org.persvr.data.ObjectPath;
import org.persvr.data.ObservablePersistable;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableClass;
import org.persvr.data.PersistableObject;
import org.persvr.data.Status;
import org.persvr.data.Transaction;
import org.persvr.datasource.DataSource;
import org.persvr.datasource.DynaFileDBSource;
import org.persvr.datasource.LocalJsonFileSource;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.javascript.PersevereNativeFunction;
import org.persvr.javascript.TestRunner;
import org.persvr.job.Job;
import org.persvr.job.Upgrade;
import org.persvr.remote.Client.IndividualRequest;
import org.persvr.security.SystemPermission;
import org.persvr.security.UserSecurity;
import org.persvr.util.Console;
import org.persvr.util.JSON;
import org.persvr.util.JSONParser;
import org.persvr.util.JSONParser.JSONException;

/**
 * This class is the main filter through which all requests should be funneled.
 * It examines each request to determine if there is a corresponding data source
 * to with data for the handling of the request. This filter handles the HTTP
 * interaction including HTTP methods including GET,PUT,POST, and DELETE and
 * status codes
 *
 * @author Kris Zyp
 *
 */
@SuppressWarnings("serial")
public class PersevereFilter extends PersevereServlet implements Filter {
	private static Log log = LogFactory.getLog(PersevereFilter.class);
	public static boolean startConsole = true;
	Scriptable global = GlobalData.getGlobalScope();
	/**
	 * Initializes the Persevere server
	 */
	public void init(FilterConfig config) throws ServletException {
		String webappRoot = config.getServletContext().getRealPath("");
		if (GlobalData.webInfLocation == null) {
			String persvrHome = System.getProperty("persevere.home");
			if (persvrHome != null) {
				GlobalData.webInfLocation = new File(persvrHome).toURI() + "/WEB-INF";
			} else {
				GlobalData.webInfLocation = new File(config.getServletContext().getRealPath("/WEB-INF")).toURI().toString();
			}
		}
		log.debug(GlobalData.webInfLocation.toString());
		global.put("coreApp", global, new DefaultHandler());
		LocalJsonFileSource.setLocalJsonPath(webappRoot);

		Job upgrade = new Upgrade();
		upgrade.execute();
		log.info("Persevere v" + Persevere.getPersevereVersion() + " Started");
		if(startConsole){
			new Console().start();
		}
		config.getServletContext().setAttribute("testrunner", new TestRunner());
		Runtime.getRuntime().addShutdownHook(new Thread() {
			@Override
			public void run() {
				log.info("Persevere shutting down");
			}
		});
	}

	public static interface RequestListener {
		public void request(HttpServletRequest request);
	}

	static DateFormat formatter = new SimpleDateFormat("EEE, d MMM yyyy HH:mm:ss zzz");
	public static DateFormat preciseFormatter = new SimpleDateFormat("EEE, d MMM yyyy HH:mm:ss.SSS zzz");

	/**
	 * Adds a header, allowing the header to be assigned in different ways
	 * depending on the response (JSONP in parameters vs real headers in direct
	 * requests)
	 *
	 * @param headerTarget
	 */
	private void addHeaders(Object headerTarget) {
		// TODO: This should go away and be replaced with a JSONPResponseWrapper and WindowNameResponseWrapper
		Map<String, String> headers = Client.getCurrentObjectResponse().getHeaders();
		for (Map.Entry<String, String> entry : headers.entrySet()) {
			if (entry.getKey().equals("status") && headerTarget instanceof HttpServletResponse) {
				((HttpServletResponse) headerTarget).setStatus(Integer.parseInt(entry.getValue()));
			}
			setHeader(entry.getKey(), entry.getValue(), headerTarget);
		}
	}

	/**
	 * Gets the parameters from a URL
	 */
	private static String getParameterFromUrlEncoded(String urlEncoded, String name) {
		if (urlEncoded.indexOf(name) > -1)//performance guard
			for (String nameValueStr : urlEncoded.split("&")) { // parse the query string
				String[] nameValue = nameValueStr.split("=", 2);
				try {
					if (name.equals(URLDecoder.decode(nameValue[0], "UTF-8")))
						return URLDecoder.decode(nameValue[1], "UTF-8");
				} catch (UnsupportedEncodingException e) {
					e.printStackTrace();
				}
			}
		return null;
	}

	/**
	 * Gets the parameters from the URL in the request
	 */
	public static String getParameterFromQueryString(HttpServletRequest request, String name) {
		if (request.getQueryString() != null) {
			// _MUST NOT_ read the body (getInputStream) or call getParameter, because that destroys it for later use
			String value = getParameterFromUrlEncoded(request.getQueryString(), name);
			return value;
		}
		return null;

	}

	/**
	 * Get a header, using parameters as a backup
	 */
	public static String getHeader(HttpServletRequest request, String name) {
		if (request == null)
			return null;
		String value = getParameterFromQueryString(request, "http-" + name);
		if (value == null)
			return request.getHeader(name);

		return value;

	}

	/**
	 * Gets a custom (non-standard) parameter using headers as a backup
	 */
	public static String getParameter(HttpServletRequest request, String name) {
		if (request == null)
			return null;
		String value = getParameterFromQueryString(request, name.replace('-', '_').toLowerCase());
		if (value == null)
			value = getParameterFromQueryString(request, "http-" + name);
		if (value == null)
			value = request.getHeader(name);
		if (value == null)
			value = request.getHeader("X-" + name);

		return value;
	}

	public static class ConditionFailedException extends RuntimeException {

		public ConditionFailedException(String message) {
			super(message);
		}

	}

	static Pattern slashPattern = Pattern.compile("[^\\[\\.]*/");

	/**
	 * The main entry point for all requests
	 */
	public void doFilter(final ServletRequest servletRequest, final ServletResponse servletResponse, final FilterChain filterChain)
			throws IOException, ServletException {
		final HttpServletRequest request = (HttpServletRequest) servletRequest;

		if (Identification.getAbsolutePathPrefix() == null) {
			// if the absolute path prefix has not been initialized, do it now. This
			// will allow the id resolver to understand absolute paths correctly
			String pathPrefix = request.getContextPath();
			Identification.setAbsolutePathPrefix(pathPrefix.length() == 1 ? "/" : (pathPrefix + "/"));
		}
		final Thread thisThread = Thread.currentThread();
		final HttpServletResponse response = (HttpServletResponse) servletResponse;
		//request.setCharacterEncoding("UTF-8");
		//response.setCharacterEncoding("UTF-8");
		final RequestHelper rh;
				
		try {
			rh = new RequestHelper((HttpServletRequest) request, (HttpServletResponse) response);
		} catch (RhinoException e) {
			String reason;
			reason = e.getMessage();
			if (reason != null && reason.startsWith("AccessError")) {
				response.setHeader("WWW-Authenticate", "JSON-RPC, Basic");
				response.setStatus(401);
			}
			response.getOutputStream().print(reason);
			return;
		}
		Client client = rh.getClientConnection();
		String seqIdString = getParameter(request, "Seq-Id");
		String transIdString = getParameter(request, "Transaction-Id");
		long seqId = -1;
		long transId = -1; 
		if (seqIdString != null){
			seqId = Long.parseLong(seqIdString);
		}
		if (transIdString != null){
			transId = Long.parseLong(transIdString);
		}
		try{
			synchronized(client){
				if(seqId>=0 && transId>=0 && getParameter(request, "Transaction")!=null){
					//start or enter the specified transaction and track sequence numbers
					client.startOrEnterTransaction(seqId, transId);
				}else{
					//just use a new tranaction for this request
					Transaction.startTransaction();
				}
				if(seqId>=0){
					client.addSequenceId(seqId);
				}
			}
			NativeObject env = new PersistableObject() {
				public Object get(String key, Scriptable start) {
					Object storedValue = super.get(key, start);
					if(storedValue != ScriptableObject.NOT_FOUND)
						return storedValue;
					if ("REQUEST_METHOD".equals(key)) {
						return request.getMethod();
					}
					if ("SERVLET_REQUEST".equals(key)) {
						return request;
					}
					if ("SERVLET_RESPONSE".equals(key)) {
						return response;
					}
					if ("PERSEVERE_REQUEST_HELPER".equals(key)) {
						return rh;
					}
					if ("SERVLET_FILTER_CHAIN".equals(key)) {
						return filterChain;
					}
					if ("SCRIPT_NAME".equals(key)) {
						return request.getServletPath();
					}
					if ("PATH_INFO".equals(key)) {
						String path = request.getRequestURI();
						return path.substring(request.getContextPath().length());
					}
					if ("CONTENT_TYPE".equals(key)) {
						return request.getContentType();
					}
					if ("CONTENT_LENGTH".equals(key)) {
						return request.getContentLength();
					}
					if ("QUERY_STRING".equals(key)) {
						return request.getQueryString();
					}
					if ("SERVER_NAME".equals(key)) {
						return request.getServerName();
					}
					if ("SERVER_PORT".equals(key)) {
						return request.getServerPort();
					}
					if ("SERVER_PROTOCOL".equals(key)) {
						return request.getProtocol();
					}
					if ("jsgi.version".equals(key)) {
						List array = Persevere.newArray();
						array.add(0);
						array.add(1);
						return array;
					}
					if ("jsgi.url_scheme".equals(key)) {
						return request.getScheme();
					}
					if ("jsgi.input".equals(key)) {
						try {
							return request.getInputStream();
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					}
					if ("jsgi.error".equals(key)) {
						return System.err;
					}
					if ("jsgi.multithread".equals(key)) {
						return true;
					}
					if ("jsgi.multiprocess".equals(key)) {
						return false;
					}
					if ("jsgi.run_once".equals(key)) {
						return false;
					}
					return Undefined.instance;
				}
				public Object getCoreValue(String name){
					return get(name, this);
				}
				@Override
				public Object[] getIds() {
					List list = new ArrayList();
					list.addAll(Arrays.asList(super.getIds()));
					list.addAll(Arrays.asList(new String[]{"REQUEST_METHOD","SCRIPT_NAME","PATH_INFO","CONTENT_TYPE","CONTENT_LENGTH","QUERY_STRING","SERVER_NAME","SERVER_PORT","SERVER_PROTOCOL","jsgi.version","jsgi.url_scheme","jsgi.input","jsgi.error","jsgi.multithread","jsgi.multiprocess","jsgi.run_once"}));
					return list.toArray();
				}

			};
			try {
				ScriptRuntime.setObjectProtoAndParent(env, global);
			} catch (Exception e1) {
			}
			Enumeration headerNames = request.getHeaderNames();
			while(headerNames.hasMoreElements()){
				String headerName = (String) headerNames.nextElement();
				if(!(headerName.equals("Content-Type") || headerName.equals("Content-Length")))
					env.put("HTTP_" + headerName.toUpperCase(), env, request.getHeader(headerName));
			}
			Object result = ((Function) global.get("coreApp", global)).call(PersevereContextFactory.getContext(), global, global,
					new Object[] { env });
			if (result instanceof Scriptable) {
				Object status = ((Scriptable) result).get("status", (Scriptable) result);
				if(status instanceof Number)
					response.setStatus(((Number)status).intValue());
				else if (status instanceof String){
					String[] statusParts = ((String)status).split(" ", 2);
					response.setStatus(Integer.parseInt(statusParts[0]), statusParts[1]);
				}
				Object headers = ((Scriptable) result).get("headers", (Scriptable) result);
				if(headers instanceof Scriptable){
					for (Object key : ((Scriptable)headers).getIds()) {
						response.setHeader(key.toString(), ((Scriptable)headers).get(key.toString(), (Scriptable) headers).toString());
					}
				}
				Object body = ((Scriptable) result).get("body", (Scriptable) result);
				if(body instanceof String)
					response.getOutputStream().write(((String)body).getBytes("UTF-8"));
				else if (body instanceof Scriptable){
					Function forEach = (Function) ScriptableObject.getProperty((Scriptable) body, "forEach");
					Scriptable global = GlobalData.getGlobalScope();
					final ServletOutputStream outputStream = response.getOutputStream();
					forEach.call(PersevereContextFactory.getContext(), global, (Scriptable) body, new Object[]{
						new PersevereNativeFunction(){
							@Override
							public Object profilableCall(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
								try {
									outputStream.write(args[0].toString().getBytes("UTF-8"));
								} catch (UnsupportedEncodingException e) {
									throw ScriptRuntime.constructError("Error", e.getMessage());
								} catch (IOException e) {
									throw ScriptRuntime.constructError("Error", e.getMessage());
								}
								return null;
							}

						}
					});
				}
				else
					throw new RuntimeException("The body must be a string or an object with a forEach");
			}
		}
		finally{
			synchronized(client){
				if(transId>=0 && getParameter(request, "Transaction")!=null){
					if(!"open".equals(getParameter(request, "Transaction"))){
						client.commitTransaction(transId);
					}else{
						Transaction.exitTransaction();
					}
					client.runUnblockedTransactions();
				}else{
					Transaction.currentTransaction().commit();
				}
			}
			//TODO: Release the read set monitoring to free those memory references
			//TODO: Release the IndividualRequest object to free those memory references
			IndividualRequest individualRequest = Client.getCurrentObjectResponse();
			if (individualRequest != null)
				individualRequest.finish(); // indicate we are finished

		}
	}

	public static class DefaultHandler extends PersevereNativeFunction {
		private boolean objectExistsForId(Identification targetId){
			try {
				return targetId.getTarget() != ScriptableObject.NOT_FOUND;
			} catch (ObjectNotFoundException e) {
				return false;
			}
		}
		@Override
		public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
			long startTime = System.currentTimeMillis();
			Scriptable env = (Scriptable) args[0];
			HttpServletRequest request = (HttpServletRequest) env.get("SERVLET_REQUEST", env);
			HttpServletResponse response = (HttpServletResponse) env.get("SERVLET_RESPONSE", env);
			RequestHelper requestHelper = (RequestHelper) env.get("PERSEVERE_REQUEST_HELPER", env);
			FilterChain filterChain = (FilterChain) env.get("SERVLET_FILTER_CHAIN", env);
			//request.setCharacterEncoding("UTF-8");
			//response.setCharacterEncoding("UTF-8");
			String contentType = request.getContentType();
			String connectionId = getParameter(request, "Client-Id");
			String reason;
			String username;
			try {
				PersistableObject.startReadSet();
				Writer writer = null;
				Map suffixHeader = null;
				String suffixString = null;
				Object headerTarget;
				String callbackParameter;
				String seqIdString = getParameter(request, "Seq-Id");
				long seqId = -1;
				if (seqIdString != null)
					seqId = Long.parseLong(seqIdString);
				if (request.getHeader("Origin") != null) {
					response.setHeader("Access-Control-Allow-Origin", "*"); // support cross-site XHR
					response.setHeader("Vary", "Origin"); // this is to make sure the cache is handled properly
				}

				String queryString = (String) env.get("QUERY_STRING", env);
				if (queryString != null) {
					// remove parameters with special meaning, the rest can be used for queries
					queryString = queryString
							.replaceAll(
									"\\&?(jsonp|transaction|client_id|subscribe_since|server_methods|seq_id|subscribe|windowname|callback|http[-_][^=]*)=[^&]*",
									"");	
					if (queryString.equals(""))
						queryString = null;
				}
				String path = env.get("PATH_INFO", env) + (queryString == null ? "" : ("?" + queryString));
				path = URLDecoder.decode(path.substring(1), "UTF8");
				if (((callbackParameter = getParameterFromQueryString(request, "jsonp")) != null || (callbackParameter = getParameterFromQueryString(
						request, "callback")) != null)) {
					// handle JSONP
					response.setContentType("application/javascript; charset=UTF-8");
					headerTarget = suffixHeader = new HashMap();
					writer = new OutputStreamWriter(response.getOutputStream(), "UTF-8");
					if (request.getAttribute("org.persvr.suspended") == null) {
						if (path.endsWith(".js")) {
							writer.write("temp=");
							suffixString = "\n" + callbackParameter + "(temp";
						} else
							writer.write(callbackParameter + "(");
						writer.flush();
					}
				} else if ((callbackParameter = getParameterFromQueryString(request, "windowname")) != null) {
					// handle window.name requests
					response.setContentType("text/html; charset=UTF-8");
					Client.getCurrentObjectResponse().httpResponse = requestHelper.response = response = new StringHttpServletResponseWrapper(
							response);
					headerTarget = suffixHeader = new HashMap();
					writer = new OutputStreamWriter(response.getOutputStream(), "UTF-8");

				} else {
					headerTarget = response;
				}

				if (suffixHeader != null) {

					formatter.setTimeZone(TimeZone.getTimeZone("GMT"));
					suffixHeader.put("Date", formatter.format(new Date()));

				}
				Matcher matcher = slashPattern.matcher(path);
				if (matcher.find()) {
					String sourceName = matcher.group();
					requestHelper.setPath(sourceName);
				}

				//slashIndex = slashIndex == -1 ? dotIndex : dotIndex == -1 ? slashIndex : Math.min(slashIndex, pathInfo.indexOf('.'));
				/*
				 * source = DataSourceManager.getSource(sourceName); if (source ==
				 * null) source = AliasIds.getAliasHandler(sourceName); } else
				 * source = null;
				 */
				String method = request.getMethod().toUpperCase();
				Identification targetId = Identification.idForString(path);

				if (log.isDebugEnabled()) {
					log.debug("Identification targetId:" + targetId);
					log.debug("Request Method: " + method);
				}

				reason = null;
				if ("GET".equals(method) || "POST".equals(method)) {
					// allow the HTTP method to be defined with a parameter
					String explicitMethod = getHeader(request, "method");
					if (explicitMethod != null)
						method = explicitMethod;
					else if ("GET".equals(method))
						// if there is not explicit method, than we can assume cookie authorization is allowed
						requestHelper.authorizeCookieAuthentication();
				}
				try {
					if (targetId instanceof ObjectNotFoundId ||
						(targetId.getSource() instanceof LocalDataSource && ((LocalDataSource) targetId.getSource()).passThrough()) ||
						("GET".equals(method) && !objectExistsForId(targetId))) {
						if ("PUT".equals(method)) {
							if (UserSecurity.hasPermission(SystemPermission.javaScriptCoding)) {
								// if the user has permission they can also update files with PUT
								File targetFile = new File(((HttpServletRequest) request).getRealPath(path));
								if (targetFile.exists()) {
									FileOutputStream fos = new FileOutputStream(targetFile);
									byte[] b = new byte[4096];
									InputStream in = request.getInputStream();
									for (int n; (n = in.read(b)) != -1;) {
										fos.write(b, 0, n);
									}
									fos.close();
									return null;
								}
							}
						} else {
							// use the default handler
							PersevereResponse redirectResponse = new PersevereResponse(response, writer);
							String realPath = request.getRealPath(request.getRequestURI());
							File targetFile;
							boolean fileExists = realPath != null && (targetFile = new File(realPath)).exists() && targetFile.isFile();

							if(!fileExists){
								Scriptable global = GlobalData.getGlobalScope();
								Object app = global.get("app",global);
								if(app instanceof Function){
									return ((Function)app).call(PersevereContextFactory.getContext(), global, global, new Object[]{env});
								}
							}
							filterChain.doFilter(new PersevereRequest(request, requestHelper, suffixString != null), redirectResponse);
							redirectResponse.flushBuffer();
							//Client.getCurrentObjectResponse().getConnection().commitTransaction();
							return null;
						}
					}

					response.setHeader("Server", "Persevere");
					if (writer == null)
						writer = new OutputStreamWriter(response.getOutputStream(), "UTF-8");
					if ("GET".equals(method) || "HEAD".equals(method)) {
						setCacheHeader(response, 2000); // need to do this to make GETs to refresh in IE
//						response.setHeader("Vary", "Accept, Referer");
					}
					Object target;

						boolean rollback = false;
						boolean newContent = false;
						boolean force204 = false;
						try {

							//postBody = IOUtils.inputStreamToString(request.getInputStream());

							if (targetId instanceof ObjectNotFoundId && "PUT".equals(method)
									&& (path.indexOf("/") == -1 || path.indexOf("/") == path.length() - 1)) {
								if (path.indexOf("/") == path.length() - 1)
									path = path.substring(0, path.length() - 1);
								String postBody = IOUtils.toString(request.getReader());

								Object postObject = null;
								postObject = requestHelper.parseJsponString(postBody); // TODO: Shouldn't do this twice
								if (postObject instanceof Map) {
									String superType = (String) ((Map) postObject).get("extends");
									if (superType != null) {
										Persevere.createNewTable(path, superType);
										return null;
									}
								}
								Persevere.createNewTable(path, "Object");
								return null;
							}
							Persistable datedTarget = null;
							if ("POST".equals(method)) // This is a hack to get POSTs to work on slice operator
								path = path.replaceAll("\\[.*\\:.*\\]", "");
							target = Client.getCurrentObjectResponse().requestData(path, "PUT".equals(method));
							if (targetId instanceof ObjectPath) {
								datedTarget = ((ObjectPath) targetId).getSecondToLastTarget();
							} else if (target instanceof Persistable)
								datedTarget = (Persistable) target;
							String subscribe = getParameter(request, "Subscribe");
							if (subscribe == null)
								subscribe = getParameterFromQueryString(request, "subscribe");
							// handle subscription requests
							if (null != subscribe) {
								final Identification<? extends Object> id = Identification.idForString(path);
								if (datedTarget != null) {
									if (target instanceof ObservablePersistable)
										((ObservablePersistable) target).subscribe();

									// TODO: Only do this if the range references "now"
									request.setAttribute("org.persvr.servletNow", new Date());
									Map<String, String> headers = new HashMap<String, String>();
									Enumeration headerEnum = request.getHeaderNames();
									while (headerEnum.hasMoreElements()) {
										String headerName = (String) headerEnum.nextElement();
										String value = request.getHeader(headerName);
										headerName = headerName.toLowerCase();
										if ("opera-range".equals(headerName))
											headerName = "range";
										headers.put(headerName, value);
									}
									headers.put("__now__", new Date().getTime() + "");
									headers.put("__pathInfo__", path);
									if (connectionId == null) {

									} else {
										if ("none".equals(subscribe)) {// far future, unsubscribe
											requestHelper.connection.removeSubscription(headers);
										} else if ("*".equals(subscribe)) {
											requestHelper.connection.addSubscription(headers);
											PersistableObject.addListener(requestHelper.connection);
										}
									}
									setHeader("Subscribed", "OK", headerTarget);

								}
							}
							byte[] postBytes = null;
							String embeddedContent = null;
							if ("application/x-www-form-urlencoded".equals(request.getContentType())) {
								// if it was POSTed from cross-domain, it may specify it's content in the http-content parameter in the entity
								if (postBytes == null)
									postBytes = IOUtils.toByteArray(request.getInputStream());
								String postBody = new String(postBytes, "UTF-8");
								embeddedContent = getParameterFromUrlEncoded(postBody, "http-content");
								if (embeddedContent == null)
									embeddedContent = getParameterFromQueryString(request, "http_content");
								if (embeddedContent != null)
									request.setAttribute("cross-site", true);
							} else if (!"GET".equals(method)) {
								// if it was a GET (that specifies a method beside GET with http-method) from cross-domain,
								//	it may specify it's content in the http-content parameter in the URL
								embeddedContent = getParameterFromQueryString(request, "http-content");
								if (embeddedContent == null)
									embeddedContent = getParameterFromQueryString(request, "http_content");
								if (embeddedContent != null)
									request.setAttribute("cross-site", true);
							}
							if (embeddedContent != null) {
								postBytes = embeddedContent.getBytes("UTF-8");
							}
							// Restart here
							String precondition = getParameter(request, "If");
							//TODO: Handle relative expressions
							if (precondition != null && !ScriptRuntime.toBoolean(Identification.idForString(precondition).getTarget()))
								throw new ConditionFailedException("Condition " + precondition + " was not satisfied");
							contentType = contentType == null ? null : contentType.split(";")[0];
							if ("POST".equals(method)) {
								Object postObject = null;
								boolean isJson = false;
								boolean safeContentType = false;
								if (couldBeJson(contentType)) {
									try {
										// this means that the content may be JSON, we are forgiving if URL encoding is used as it is
										// the default for Ajax requests
										if (postBytes == null)
											postBytes = IOUtils.toByteArray(request.getInputStream());
										String postBody = new String(postBytes, "UTF-8");
										postObject = requestHelper.parseJsponString(postBody); // TODO: Shouldn't do this twice
										// If it parsed we can be assured that it wasn't cross-site browser generated
										requestHelper.authorizeCookieAuthentication();
										// detect JSON-RPC calls
										if (postObject instanceof Map && ((Map) postObject).containsKey("id")
												&& ((Map) postObject).containsKey("method") && ((Map) postObject).containsKey("params")
												&& ((Map) postObject).get("params") instanceof List) {
											// It looks like a JSON-RPC request, treat it as a method call
											requestHelper.handleRPC(target, (Map) postObject);
											// we set the username again because it may have changed during the RPC
											username = UserSecurity.getUserName(UserSecurity.currentUser());
											// we set the username so the client side can access it
											setHeader("Username", "public".equals(username) ? null : username, headerTarget);
											// write out the response (this could actually be a request from the server)
											Client.getCurrentObjectResponse().writeWaitingRPCs();
											return null;
										}
										Object bodyData = requestHelper.convertParsedToObject(postObject);
										String newLocation = request.getHeader("Content-ID");
										// this indicates that the request has a client-assigned id to use temporarily
										if (newLocation != null) {
											// get rid of the brackets and the contextPath
											newLocation = newLocation.substring(request.getContextPath().length() + 2, newLocation.length() - 1);
											Client client = Client.getCurrentObjectResponse().getConnection();
											Persistable createdObject = client.getClientSideObject(newLocation);
											if (createdObject == null)
												client.clientSideObject(newLocation, createdObject = Persevere.newObject(((Persistable) target)
														.getId()));
											target = createdObject;
											for (Map.Entry<String, Object> entry : ((Persistable) bodyData).entrySet(0)) {
												createdObject.set(entry.getKey(), entry.getValue());
											}
										} else {
											target = postObject((Persistable) target, bodyData);
										}
										newContent = true;
										isJson = true;
									} catch (JSONParser.JSONException e) {
										// if the content type explicity said it was JSON or JavaScript we will throw an error
										if (contentType == null || contentType.indexOf("json") > 0 || contentType.indexOf("javascript") > 0) {
											throw e;
										}
									}

								} else
									safeContentType = true;
								if (!isJson) {
									// it wasn't JSON (couldn't be parsed) and so we treat it as a file
									if (ServletFileUpload.isMultipartContent(request)) {
										if(target instanceof List){
											target = Persevere.newObject(((Persistable) target).getId());
										}
										// Create a factory for disk-based file items
										FileItemFactory factory = new DiskFileItemFactory();

										// Create a new file upload handler
										ServletFileUpload upload = new ServletFileUpload(factory);

										// Parse the request
										List<FileItem> items = upload.parseRequest(request);
										for (FileItem item : items) {
											if (item.isFormField()) {
												((Persistable) target).set(item.getFieldName(), item.getString());
											} else {
												Persistable fileTarget = createFile(item.getContentType(), null, item.getInputStream());
												fileTarget.set("name", item.getName());
												if (!(target instanceof List)) {
													((Persistable) target).set(item.getFieldName(), fileTarget);
												}
											}
										}
									} else {
										if (safeContentType)
											requestHelper.authorizeCookieAuthentication();
										DataSource source = ((Persistable) target).getId().source;
										String contentDisposition = request.getHeader("Content-Disposition");
										if (postBytes == null)
											postBytes = IOUtils.toByteArray(request.getInputStream());
										// create a File using the provided file/binary data
										Persistable fileTarget = createFile(contentType, contentDisposition, postBytes);
										if (!(source instanceof DynaFileDBSource)) {
											Persistable resourceTarget = Persevere.newObject(((Persistable) target).getId());
											resourceTarget.put("representation:" + contentType, resourceTarget, fileTarget);
											((PersistableObject) resourceTarget).setAttributes("representation:" + contentType,
													ScriptableObject.DONTENUM);
										}
										target = fileTarget;
										newContent = true;
										force204 = true;
									}
								}

								response.setStatus(201);
							} else if ("PUT".equals(method)) {
								boolean isJson = false;
								Identification<? extends Object> id = Identification.idForString(path);
								try {
									if (couldBeJson(contentType)) {
										if (postBytes == null)
											postBytes = IOUtils.toByteArray(request.getInputStream());

										String postBody = new String(postBytes, "UTF-8");
										if (id instanceof ObjectPath) {
											Object value = id.getTarget();
											if (value instanceof Persistable) {
												id = ((Persistable) value).getId();
											}
										}
										target = requestHelper.convertWithKnownId(postBody, id);

										isJson = true;
									}
								} catch (JSONParser.JSONException e) {
									if (contentType == null || contentType.indexOf("json") > 0 || contentType.indexOf("javascript") > 0) {
										throw e;
									}
								}
								if (!isJson) {
									// create an alternate representation for the target object using the provided file/binary data
									DataSource source = target instanceof Persistable ? ((Persistable) target).getId().source : null;
									String contentDisposition = request.getHeader("Content-Disposition");
									if (postBytes == null)
										postBytes = IOUtils.toByteArray(request.getInputStream());
									Persistable fileTarget = createFile(contentType, contentDisposition, postBytes);
									if (!(source instanceof DynaFileDBSource) && !(id instanceof ObjectPath)) {
										if (target instanceof Persistable) {
											((Persistable) target).set("representation:" + contentType, fileTarget);
											((PersistableObject) target).setAttributes("representation:" + contentType, ScriptableObject.DONTENUM);
										}
									}
									newContent = true;
									force204 = true;
									target = fileTarget;
								}
								if (id instanceof ObjectPath) {
									// if it is a path we set the value of the property
									Object key = ((ObjectPath) id).getLastPath();
									Persistable secondToLastTarget = (Persistable) ((ObjectPath) id).getSecondToLastTarget();
									if (key instanceof Integer)
										secondToLastTarget.put((Integer) key, secondToLastTarget, target);
									else {
										secondToLastTarget.set((String) key, target);
									}
								} else if (!(target instanceof Persistable))
									//TODO: This should be allowed if an ObjectPath is used
									throw new RuntimeException("Can not replace an identified object with a primitive value");
								if (!isJson) {
									target = Undefined.instance;// no need to return the file just uploaded
								}

							} else if ("DELETE".equals(method)) {
								// delete the target object or property
								Identification<? extends Object> id = Identification.idForString(path);
								if (id instanceof ObjectPath) {
									// it is a property
									Object key = ((ObjectPath) id).getLastPath();
									Persistable secondToLastTarget = (Persistable) ((ObjectPath) id).getSecondToLastTarget();
									if (key instanceof Integer)
										secondToLastTarget.delete((Integer) key);
									else
										secondToLastTarget.delete((String) key);
									return null;
								} else if (id instanceof JsonPath) {
									//TODO: Needs to be a way to do delete items from JSONPath queries
									for (int i = ((List) target).size(); i > 0;) {
										i--;
										Persistable item = ((Persistable) ((List) target).get(i));
										item.delete();
									}
									return null;
								}
								if (target instanceof Persistable) {
									((Persistable) target).delete();
								}
								target = Undefined.instance;
							}
							if (datedTarget != null)
								setHeader("Last-Modified", "" + preciseFormatter.format(datedTarget.getLastModified()), headerTarget);
							else
								setHeader("Last-Modified", preciseFormatter.format(new Date()), headerTarget);
							if (target instanceof Persistable
									&& !("PUT".equals(method) || "POST".equals(method) || "DELETE".equals(method) || "GET".equals(method))) {// PUT and POST are special and a result of the modifications and new objects which naturally result from other actions
								Object httpMethod = ScriptableObject.getProperty((Persistable) target, method.toLowerCase()); // TODO: Need to camelcase the method
								// we can handle alternate HTTP methods by defining methods on objects
								if (httpMethod instanceof Function) {
									// if there is a method, we should call it

									if (postBytes == null)
										postBytes = IOUtils.toByteArray(request.getInputStream());
									String postBody = new String(postBytes, "UTF-8");

									Object postObject = requestHelper.parseJsponString(postBody); // TODO: Shouldn't do this twice
									Object bodyData = requestHelper.convertParsedToObject(postObject);
									String[] parts = FunctionUtils.getSource((Function) httpMethod).split("\\(|\\)", 3);
									if (parts.length < 2)
										throw new RuntimeException("Invalid function toString");
									String[] paramParts = parts[1].split(",");
									List params = new ArrayList();
									for (String param : paramParts) {
										if ("content".equals(param)) {
											params.add(bodyData);
										} else if ("uri".equals(param)) {
											params.add(path);
										} else {
											String value = getParameter(request, param);
											params.add(value);
										}
									}
									target = ((Method) httpMethod).call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(),
											(Scriptable) target, params.toArray(), true);
								} else {
									// indicate what methods are allowed
									Set<Object> keys = new HashSet<Object>(Arrays.asList(((Persistable) target).getIds()));
									//TODO: use PersistableObject.entrySet(target, 1);
									// these are the non-enumerable default methods
									keys.add("get");
									keys.add("post");
									keys.add("delete");
									keys.add("put");
									keys.add("head");
									String methodList = "";
									for (Object methodKey : keys) {
										if (((Persistable) target).get(methodKey.toString()) instanceof Method)
											methodList += methodKey + ", ";
									}
									methodList += "OPTIONS";
									methodList = methodList.toUpperCase();
									response.addHeader("Allow", methodList);
									if (method.equals("OPTIONS"))
										target = "See Allow header for available methods";
									else {
										response.setStatus(405); // Method not allowed
										target = "Method not allowed, see Allow header for available methods";
									}

								}
							}
							username = UserSecurity.getUserName();
							// we set the username so the client side can access it
							setHeader("Username", "public".equals(username) ? null : username, headerTarget);
							/*
							 * if (target) response.setStatus(201);
							 */
							/*
							 * String range = getParameter(request,"Range"); if
							 * (range == null) { range =
							 * getParameter(request,"Opera-Range"); }
							 *
							 * target = handleRange(range,target, new
							 * Date(),response);
							 */
						} catch (Throwable e) {
							rollback = true;
							log.debug(e);
							throw e;
						} finally {
							if (rollback) // failed, rollback the transaction
								Transaction.currentTransaction().abort();
							else {
								// success
							}
						}
						String output;
						if (newContent && target instanceof Persistable && ((Persistable) target).getId().isAssignedId()) {
							String url = request.getRequestURL().toString();
							int contextPathStart = url.indexOf(request.getContextPath() + '/', 9);
							response.setHeader("Location", url.substring(0, contextPathStart) + request.getContextPath() + '/'
									+ ((Persistable) target).getId().toString());
						}
						if (target == Scriptable.NOT_FOUND || target == Undefined.instance || force204) {
							if ("GET".equals(method))
								response.setStatus(404); // undefined means it's wasn't found
							else
								response.setStatus(204); // undefined could be returned from a method call
						} else {
							String acceptValue = getParameterFromQueryString(request, "http-Accept");
							if(acceptValue == null){
								acceptValue = ScriptableObject.getProperty(env, "HTTP_ACCEPT").toString();
							}
							DataSerializer.serialize(target, acceptValue);
							// just in case any changes were made
						}
					
				} catch (Throwable e) {
					if ("org.mortbay.jetty.RetryRequest".equals(e.getClass().getName())) { // this should not be stopped
						log.debug(e);
						throw (RuntimeException) e;
					}

					log.warn(e);

					while (e.getCause() != null)
						e = e.getCause();

					reason = e.getMessage();
					log.debug("reason :" + reason);
					// output the correct HTTP status code
					if (e instanceof ObjectNotFoundException)
						response.setStatus(404);
					else if (e instanceof SecurityException) {
						response.setHeader("WWW-Authenticate", "JSON-RPC, Basic");
						response.setStatus(401);
					} else if (e instanceof JSONParser.JSONException || e instanceof BadRequestException)
						response.setStatus(400);
					else if (e instanceof ConditionFailedException)
						response.setStatus(412);
					else if (e instanceof RequestedRangeNotSatisfiable)
						response.setStatus(416);
					else if (reason != null && reason.startsWith("URIError"))
						response.setStatus(400);
					else if (reason != null && reason.startsWith("TypeError"))
						response.setStatus(403);
					else if (reason != null && reason.startsWith("AccessError")) {
						response.setHeader("WWW-Authenticate", "JSON-RPC, Basic");
						response.setStatus(401);
					} else {
						if (e instanceof RhinoException)
							log.warn(((RhinoException) e).details() + '\n' + ((RhinoException) e).getScriptStackTrace());
						else
							log.warn("", e);

						response.setStatus(500);
					}
					response.setContentType("application/json");
					if (reason == null) {
						if (writer != null)
							writer.write(JSON.quote("Failed"));
					} else {
						if (writer == null) {
							writer = new PrintWriter(response.getOutputStream());
						}
						if (reason.startsWith("InternalError:"))
							reason = reason.substring(15);
						writer.write(JSON.quote(reason));
					}
				}

				finally {
					// handle the different types of response types (JSONP or window.name)
					if (writer != null && !Boolean.TRUE.equals(request.getAttribute("org.persvr.suspended"))) {
						//writer = new PrintWriter(response.getOutputStream());
						if (response instanceof StringHttpServletResponseWrapper) { // this means we are doing a frame name transport
							HttpServletResponse realResonse = (HttpServletResponse) ((StringHttpServletResponseWrapper) response).getResponse();
							realResonse.getOutputStream().print("<html>" + "<script type='text/javascript'>" + "var loc = window.name;window.name=");
							realResonse.getOutputStream().print(JSON.quote(response.toString()));
							realResonse.getOutputStream().print(";location=loc;");
							realResonse.getOutputStream().print("</script></html>");

						} else {
							if (suffixString != null)
								writer.write(suffixString);
							if (suffixHeader != null)
								writer.write("," + JSON.serialize(suffixHeader) + ");");
						}
						writer.flush();
						response.setHeader("Accept-Ranges", "bytes,items");

						writer.close();
					}
					Status.addRequestTiming(System.currentTimeMillis() - startTime);

					if (log.isDebugEnabled()) {
						log.debug("Request timing: " + (System.currentTimeMillis() - startTime));
					}
				}
				return null;

			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}
	}

	/**
	 * Create a new instance of the File JS class in Persevere with the provided
	 * binary data
	 *
	 * @param contentType
	 * @param data
	 * @return
	 * @throws IOException
	 */
	private static Persistable createFile(String contentType, String contentDisposition, Object data) throws IOException {
		Persistable fileTarget = Persevere.newObject("File");
		String charSet = null;

		if (contentType != null) {
			String[] contentTypeParts = contentType.split(";\\s*");
			contentType = contentTypeParts[0];
			for (String part : contentTypeParts) {
				if (part.startsWith("charset")) {
					charSet = part.split("=")[1];
				}
			}
		}
		fileTarget.set("contentType", contentType);
		if(contentDisposition != null)
			fileTarget.set("contentDisposition", contentDisposition);
		contentType = contentType == null ? null : contentType.split(";")[0];
		if (contentType != null && (contentType.startsWith("text/") || charSet != null)) {
			if (data instanceof InputStream)
				fileTarget.set("content", IOUtils.toString(new InputStreamReader((InputStream) data, charSet == null ? "UTF-8" : charSet)));
			else
				fileTarget.set("content", new String((byte[]) data, charSet == null ? "UTF-8" : charSet));
		} else {
			if (data instanceof InputStream)
				fileTarget.set("content", new BinaryData((InputStream) data));
			else
				fileTarget.set("content", new BinaryData((byte[]) data));
		}
		return fileTarget;
	}

	private static boolean couldBeJson(String contentType) {
		return contentType == null || contentType.indexOf("json") > 0 || contentType.indexOf("javascript") > 0
				|| contentType.indexOf("www-form-urlencoded") > 0 || contentType.indexOf("application/xml") > -1 || contentType.indexOf("text/plain") > -1;
	}

	private static Object postObject(Persistable target, Object bodyData) {
		if (target instanceof PersistableClass) {
			// if we post to a schema, we can just consider this a post to the table
			target = (Persistable) Identification.idForString(((PersistableClass) target).getId().toString() + "/").getTarget();
		}
		if (bodyData instanceof Persistable) {
			Persistable newObject = (Persistable) bodyData;
			ScriptableObject arrayProto = (ScriptableObject) ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(), "Array");
			ScriptableObject objectProto = (ScriptableObject) ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(), "Object");

			if ("".equals(((Persistable) target).getId().subObjectId)
					&& (((Persistable) bodyData).getPrototype() == objectProto || ((Persistable) bodyData).getPrototype() == arrayProto)) {
				// this means it is a generic object or list, we need to make it be the right class
				DataSource thisSource = ((Persistable) target).getId().source;
				Class targetClass = DataSourceManager.getObjectsClass(thisSource).objectsClass;
				if (bodyData instanceof List) {
					// this means that an array was provided for a data source that takes objects; we
					//	will assume this means that the user wants to create multiple objects
					int i = 0;
					for (Object obj : (List) bodyData) {
						if (obj instanceof Persistable) {
							newObject = Persevere.newObject(((Persistable) target).getId());
							for (Map.Entry<String, Object> entry : ((Persistable) obj).entrySet(0)) {
								newObject.set(entry.getKey(), entry.getValue());
							}
							((List) bodyData).set(i++, newObject);
						} else
							throw new RuntimeException("Bulk update arrays should only include objects");
					}
					return bodyData;
				} else {
					newObject = bodyData instanceof List ? Persevere.newArray(((Persistable) target).getId()) : Persevere
							.newObject(((Persistable) target).getId());
					for (Map.Entry<String, Object> entry : ((Persistable) bodyData).entrySet(0)) {
						newObject.set(entry.getKey(), entry.getValue());
					}
				}
			}
			Client.getCurrentObjectResponse().getConnection().changeClientSideObject((Persistable) bodyData, newObject);
			bodyData = newObject;
			if ("".equals(((Persistable) target).getId().subObjectId))
				return newObject; // all that needs to be done in adding a posting to the root list
		}
		if ("".equals(((Persistable) target).getId().subObjectId))
			throw new RuntimeException("You can only add objects to tables");

		if (target instanceof List)
			((List) target).add(bodyData);
		else if (bodyData instanceof Persistable){ // TODO: may want this to be synchronized
			for(Map.Entry entry : ((Persistable)bodyData).entrySet(0)){
				target.set(entry.getKey().toString(), entry.getValue());
			}
			bodyData = target;
		}
		else
			throw new BadRequestException("Can only POST an object");
		return bodyData;
	}

	public static void setHeader(String name, String value, Object headerTarget) {
		if (headerTarget instanceof HttpServletResponse)
			((HttpServletResponse) headerTarget).setHeader(name, value);
		else if (headerTarget instanceof Map) {
			try {
				((Map) headerTarget).put(name, value);
			} catch (JSONException e) {
				throw new RuntimeException(e);
			}
		} else
			throw new RuntimeException("Unacceptable header target");
	}

	/**
	 * The destroy method is called by the web container when the servlet is
	 * taken out of service and should not be called directly. In this case, the
	 * method calls the DataSourceManager to iterate through the data sources
	 * that may require clean-up.
	 *
	 * @return
	 */
	public void destroy() {
		DataSourceManager.destroy();
	}

	private static void setCacheHeader(HttpServletResponse response, long expirationTime) {
		//response.setHeader("Pragma", "");
		//response.setHeader("Cache-Control", "must-revalidate");
		Date expirationDate = new Date(new Date().getTime() + expirationTime);
		DateFormat formatter = new SimpleDateFormat("EEE, d MMM yyyy HH:mm:ss zzz", Locale.US);
		formatter.setTimeZone(TimeZone.getTimeZone("GMT"));
		response.setHeader("Expires", "Thu, 01 Jan 1970 01:00:00 GMT");
	}

	@Override
	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		setCacheHeader(response, 2000);
		RequestHelper requestHelper = new RequestHelper(request, response);
		doPost(requestHelper);
	}

	static class BytesServletOutputStream extends ServletOutputStream {
		ByteArrayOutputStream os = new ByteArrayOutputStream();

		public void write(byte[] b, int off, int len) {
			os.write(b, off, len);
		}

		public void write(byte[] b) throws IOException {
			os.write(b);
		}

		public void write(int b) {
			os.write(b);
		}

		public void writeTo(OutputStream out) throws IOException {
			os.writeTo(out);
		}

		public String toString() {
			try {
				return os.toString("UTF-8");
			} catch (UnsupportedEncodingException e) {
				throw new RuntimeException(e);
			}
		}

	}

	static class StringHttpServletResponseWrapper extends HttpServletResponseWrapper {

		public StringHttpServletResponseWrapper(HttpServletResponse response) {
			super(response);
		}

		BytesServletOutputStream os = new BytesServletOutputStream();;

		@Override
		public ServletOutputStream getOutputStream() throws IOException {
			return os;
		}

		@Override
		public PrintWriter getWriter() throws IOException {
			return new PrintWriter(new OutputStreamWriter(os, "UTF-8"));
		}

		public String toString() {
			return os.toString();
		}

		@Override
		public void setContentType(String type) {
		}
	}

	public static interface LocalDataSource {
		public boolean passThrough();
	}

}
