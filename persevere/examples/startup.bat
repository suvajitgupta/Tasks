set PERSEVERE_HOME=C:\dev\Persevere\builds\persevere
java -Dpersevere.instance.data=WEB-INF/data -Dpersevere.instance.config=WEB-INF/config -Djetty.port=9080 -Dpersevere.home=%PERSEVERE_HOME% -Djetty.home=%PERSEVERE_HOME% -Djetty.lib=%PERSEVERE_HOME%\WEB-INF\lib -DSTOP.PORT=9079 -DSTOP.KEY=secret -jar %PERSEVERE_HOME%\start.jar C:\dev\Persevere\etc\instanceJetty.xml
