package org.persvr.util;

import java.io.*;
import java.lang.management.ManagementFactory;
import java.net.*;
import java.util.*;
import org.apache.commons.cli.*;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mortbay.jetty.Server;
import org.mortbay.jetty.handler.ContextHandlerCollection;
import org.mortbay.jetty.webapp.WebAppContext;
import org.mortbay.resource.FileResource;
import org.mortbay.resource.Resource;
import org.mortbay.util.URIUtil;
import org.mortbay.xml.XmlConfiguration;

public class JettyStart {

	static private Log log = LogFactory.getLog(JettyStart.class);
	static Timer timer;
	// options
	public static final String VERSION = "v";
	public static final String HELP = "h";
	public static final String INSTANCE_ROOT = "r";
	public static final String DB_PATH = "d";
	public static final String PORT = "p";
	public static final String CORE_TESTS = "core-tests";
	public static final String BASE_URI = "base-uri";
	public static final String INSTANCE_TESTS = "tests";
	public static final String GEN_SERVER = "gen-server";
	public static final String ERASE_DB = "eraseDB";
	public static final String START = "start";
	public static final String STOP = "stop";

	/* ------------------------------------------------------------ */
	/* ------------------------------------------------------------ */
	/**
	 * Construct server from command line arguments.
	 * 
	 * @param args
	 */
	@SuppressWarnings( { "finally", "static-access" })
	public static void main(String[] args) throws IOException {
		Options options = generateCliOptions();
		boolean runTests = false;

		CommandLineParser parser = new PosixParser();
		CommandLine commandLine;
		try {
			commandLine = parser.parse(options, args);
		} catch (Exception e) {
			log.warn("Unable to parse command line options: " + e.getMessage());
			showHelp(options);
			return;
		}

		if (commandLine.hasOption(HELP)) {
			showHelp(options);
			return;
		}

		if (commandLine.hasOption(VERSION)) {
			Properties props = new Properties();
			try {
				props.load(JettyStart.class.getResourceAsStream("/org/persvr/persevere.properties"));
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
			log.info("Persevere, v" + props.getProperty("version"));
			return;
		}

		int listenPort = Integer.parseInt(commandLine.getOptionValue(PORT, "8080"));
		System.setProperty("persevere.port", Integer.toString(listenPort));
		// we expect these to have been defined by the shell script
		String localPath = System.getProperty("persevere.instance", ".");
		String persvrHome = System.getProperty("persevere.home", ".");
		System.setProperty("persevere.home", persvrHome); //make it available to the PersevereFilter
		if (commandLine.hasOption(GEN_SERVER)) {
			InstanceGenerator.createNewInstance(localPath, commandLine.getOptionValue(GEN_SERVER));
			return;
		}

		String instancePath = ".";
		if (commandLine.hasOption(CORE_TESTS)) {
			instancePath = persvrHome + File.separator + "core-tests";
			System.setProperty("persevere.tests", instancePath + "/WEB-INF/tests");
			runTests = true;
		} else {
			if (commandLine.hasOption(INSTANCE_ROOT))
				instancePath = commandLine.getOptionValue(INSTANCE_ROOT);
			else {
				// our instance path should otherwise be the path the persvr script was invoked from
				instancePath = localPath;
				if (!(new File(instancePath + "/WEB-INF").exists()) && new File(instancePath + "/persvr").exists() &&
						new File(instancePath + "/../WEB-INF").exists()){
					// go to the parent directory if we are in the bin directory
					instancePath += "/..";
				}
			}
		}

		if (commandLine.hasOption(INSTANCE_TESTS)) {
			System.setProperty("persevere.tests", instancePath + "/WEB-INF/tests");
			runTests = true;
		}

		if (commandLine.hasOption(ERASE_DB)) {
			InstanceGenerator.eraseDatabase(instancePath);
			return;
		}
		String webInf = instancePath + "/WEB-INF";
		if (commandLine.hasOption(START)) {
			final File processFile = new File(webInf + "/process");
			String processName = ManagementFactory.getRuntimeMXBean().getName();
			processName = processName.replaceAll("@.*", "");
			FileOutputStream fos = new FileOutputStream(processFile);
			fos.write(processName.getBytes());
			fos.close();
			timer = new Timer("Process file removal monitor", true);
			timer.schedule(new TimerTask(){
				@Override
				public void run() {
					if(!processFile.exists()) // shutdown if the process file doesn't exist anymore
						System.exit(0);
				}
				
			}, 100, 100);
		}
		if (commandLine.hasOption(STOP)) {
			File processFile = new File(webInf + "/process");
			if(processFile.exists())
				processFile.delete();
			else
				throw new RuntimeException("No Persevere process was found");
			return;
		}
		String baseURI = commandLine.getOptionValue(BASE_URI, "/");
		System.setProperty("persevere.base-uri", baseURI);
		String database = commandLine.getOptionValue(DB_PATH, instancePath + "/WEB-INF/" + ((runTests) ? "tests/data" : "data"));
		// System.out.println( "Database " + database );
		System.setProperty("persevere.instance.data", database);
		System.setProperty("persevere.instance.WEB-INF", webInf);
		startJetty(persvrHome, instancePath, listenPort, baseURI);
	}

	static public Options generateCliOptions() {
		Options options = new Options();
		options.addOption(VERSION, "version", false, "Print Persevere's version and quit.");
		options.addOption(HELP, "help", false, "Display this message and quit.");
		options.addOption(OptionBuilder.withLongOpt("port").hasArg().withArgName("port_number").withDescription(
				"Listen on this port for connections.").create(PORT));
		options.addOption(OptionBuilder.withLongOpt("database").hasArg().withArgName("/path/to/db").withDescription("Use the database at this path.")
				.create(DB_PATH));
		options.addOption(OptionBuilder.withLongOpt("root").hasArg().withArgName("/path/to/instance").withDescription(
				"Start up the instance at this path.").create(INSTANCE_ROOT));
		options.addOption(OptionBuilder.withLongOpt(GEN_SERVER).hasArg().withArgName("name").withDescription("Generate a new server instance.")
				.create());
		options.addOption(OptionBuilder.withLongOpt(CORE_TESTS).withDescription("Run Persevere's internal test suite.").create());
		options.addOption(OptionBuilder.withLongOpt(INSTANCE_TESTS).withDescription("Run tests for your instance.").create());
		options.addOption(OptionBuilder.withLongOpt(ERASE_DB).withDescription("Clear out your entire database.").create());
		options.addOption(OptionBuilder.withLongOpt(START).withDescription("Start an instance of Persevere that can be stopped").create());
		options.addOption(OptionBuilder.withLongOpt(STOP).withDescription("Stop the instance of Persevere running at this path").create());
		options.addOption(OptionBuilder.withLongOpt(BASE_URI).hasArg().withArgName("/path").withDescription("Specify the base URI for persevere.")
				.create());
		return options;
	}

	/*
	 * Try to load a jetty.xml from the instance's WEB-INF/config dir. If it's
	 * not there, fall back to the default version in the core installation.
	 */
	static public void startJetty(String persvrHome, String instancePath, int port, String baseURI) {
		try {
			Server server = new Server();

			String sep = File.separator;
			File configFile = new File(instancePath + sep + "WEB-INF" + sep + "config" + sep + "jetty.xml");
			if (!configFile.exists()) {
				configFile = new File(persvrHome + sep + "etc" + sep + "jetty.xml");
				if (!configFile.exists())
					throw new RuntimeException("Couldn't find a valid jetty.xml config in your instance, or in the Persevere installation.");
			}

			XmlConfiguration xmlconfig = new XmlConfiguration(new FileInputStream(configFile));
			Map props = xmlconfig.getProperties();
			props.put("port", port);
			xmlconfig.configure(server);

			WebAppContext webapp = new WebAppContext();
			webapp.setResourceBase(instancePath);

			Resource resource = InheritingFileResource.newResource(instancePath, persvrHome);
			webapp.setBaseResource(resource);
			webapp.setAttribute("persevere.resource", resource);
			webapp.setContextPath(baseURI);
			webapp.setDefaultsDescriptor(persvrHome + sep + "etc" + sep + "webdefault.xml");

			ContextHandlerCollection contexts = new ContextHandlerCollection();
			server.setHandler(contexts);
			contexts.addHandler(webapp);

			server.start();
			String testsDirectory = System.getProperty("persevere.tests");
			if (testsDirectory != null) {
				((Runnable) webapp.getServletContext().getAttribute("testrunner")).run();
			}
		} catch (Exception e) {
			log.warn(e);
		}
	}

	static public void showHelp(Options opts) {
		HelpFormatter formatter = new HelpFormatter();
		formatter.printHelp("persvr [options]", "\nOptions:", opts, "\n");
	}

	static class InheritingFileResource extends FileResource {
		FileResource baseFileResource;

		private static URL pathToUrl(String path) throws IOException {
			File file = new File(path).getCanonicalFile();
			URL url = file.toURI().toURL();
			return url;
		}

		public static Resource newResource(String instance, String base) throws IOException, URISyntaxException {
			URL instanceURL = pathToUrl(instance);
			URL baseURL = pathToUrl(base);
			Resource instanceFileResource = new FileResource(instanceURL);
			if (baseURL.equals(instanceURL))
				return new FileResource(instanceURL);
			Resource baseFileResource = new FileResource(pathToUrl(base));
			return new InheritingFileResource(instanceFileResource, baseFileResource);
		}

		public InheritingFileResource(Resource instance, Resource base) throws IOException, URISyntaxException {
			super(instance.getURL());
			baseFileResource = (FileResource) base;
		}

		@Override
		public Resource addPath(String path) throws IOException, MalformedURLException {
			Resource resource = super.addPath(path);
			if (resource == null || !resource.exists())
				resource = baseFileResource.addPath(path);
			else if (resource.isDirectory()) {
				Resource baseResource = baseFileResource.addPath(path);
				if (baseResource.isDirectory()) {
					try {
						return new InheritingFileResource(resource, baseResource);
					} catch (URISyntaxException e) {
						throw new RuntimeException(e);
					}
				}

			}
			return resource;
		}

		@Override
		public String[] list() {
			String[] instanceList = super.list();
			String[] baseList = baseFileResource.list();
			if (instanceList == null)
				return baseList;
			if (baseList == null)
				return instanceList;
			Set<String> set = new HashSet<String>(Arrays.asList(instanceList));
			set.addAll(Arrays.asList(baseList));
			return set.toArray(new String[set.size()]);
		}

		public File getFile() {
			File file = super.getFile();
			if (file.exists())
				return file;
			return baseFileResource.getFile();
		}

		@Override
		public long lastModified() {
			return getFile().lastModified();
		}

		@Override
		public boolean exists() {
			return getFile().exists();
		}

		@Override
		public InputStream getInputStream() throws IOException {
			return new FileInputStream(getFile());
		}

		@Override
		public String getName() {
			return getFile().getAbsolutePath();

		}

		@Override
		public OutputStream getOutputStream() throws IOException, SecurityException {
			return new FileOutputStream(getFile());
		}

		@Override
		public boolean isDirectory() {
			return getFile().isDirectory();
		}

		@Override
		public long length() {
			return getFile().length();
		}

		@Override
		public boolean renameTo(Resource dest) throws SecurityException {
			if (dest instanceof FileResource)
				return getFile().renameTo(((FileResource) dest).getFile());
			else
				return false;
		}

	}
}
