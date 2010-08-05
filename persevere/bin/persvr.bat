
@echo off

:: Check for  JAVA_HOME
if ("%JAVA_HOME%"=="") goto :noJavaHome
:: Make sure it's sane
if not exist "%JAVA_HOME%\bin\java.exe" goto :badJavaHome

:: Where were we invoked from?
set LOCAL_DIR=%CD%
:: Where is the installation dir?
set PERSVR_HOME=%~dp0..
:: Any command line args?
set PERSVR_CMD_LINE_ARGS=%*

set CLASSPATH=^
%PERSVR_HOME%\WEB-INF\classes;^
%PERSVR_HOME%\WEB-INF\lib\js.jar;^
%PERSVR_HOME%\WEB-INF\lib\persevere.jar;^
%PERSVR_HOME%\WEB-INF\lib\cometd-api-1.0.beta4.jar;^
%PERSVR_HOME%\WEB-INF\lib\cometd-bayeux-6.1.14.jar;^
%PERSVR_HOME%\WEB-INF\lib\commons-codec-1.3.jar;^
%PERSVR_HOME%\WEB-INF\lib\commons-fileupload-1.2.1.jar;^
%PERSVR_HOME%\WEB-INF\lib\commons-httpclient-3.0.1.jar;^
%PERSVR_HOME%\WEB-INF\lib\commons-io-1.4.jar;^
%PERSVR_HOME%\WEB-INF\lib\commons-logging-1.1.jar;^
%PERSVR_HOME%\WEB-INF\lib\commons-cli-1.1.jar;^
%PERSVR_HOME%\WEB-INF\lib\catalina.jar;^
%PERSVR_HOME%\WEB-INF\lib\jline-0.9.94.jar;^
%PERSVR_HOME%\lib\servlet-api-2.5-6.1.14.jar;^
%PERSVR_HOME%\lib\jetty-util-6.1.14.jar;^
%PERSVR_HOME%\lib\jetty-6.1.14.jar

set PERSEVERE_LAUNCHER=org.persvr.util.JettyStart

:: Launch it!
java -classpath "%CLASSPATH%" ^
 "-Dpersevere.instance=%LOCAL_DIR%" ^
 "-Dpersevere.home=%PERSVR_HOME%" ^
 "%PERSEVERE_LAUNCHER%" %PERSVR_CMD_LINE_ARGS%

:: When this completes, just skip to the end 
goto :end
 
:badJavaHome
echo.
echo ERROR: JAVA_HOME is set to an invalid directory.
echo JAVA_HOME = %JAVA_HOME%
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation
echo.
goto end

:noJavaHome
echo.
echo ERROR: JAVA_HOME not found in your environment.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation
echo.
goto end
 
:end


