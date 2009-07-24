<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
    xmlns="http://www.w3.org/1999/xhtml">
<xsl:output method="xml" indent="yes"/>

<xsl:template match="index">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <title>API Index</title>
        <link href="include/api.css" rel="stylesheet" type="text/css"/>
        <script language="javascript" src="include/api.js"></script>
    </head>
    <body>
        <table class="nav">
            <tr>
                <td><a class="nav" href="index.xml">API Index</a></td>
            </tr>
        </table>
        <h1>Tasks Project API Index</h1>
        <xsl:if test="resource">
            <h3>Resources</h3>
            <ul>
                <xsl:for-each select="resource">
                    <xsl:sort select="@name"/>
                    <xsl:variable name="file" select="@file"/>
                    <li><a href="{$file}"><xsl:value-of select="@name"/></a></li>
                </xsl:for-each>
            </ul>
        </xsl:if>
        <xsl:if test="object">
            <h3>Supporting Objects</h3>
            <ul>
                <xsl:for-each select="object">
                    <xsl:sort select="@name"/>
                    <xsl:variable name="file" select="@file"/>
                    <li><a href="{$file}"><xsl:value-of select="@name"/></a></li>
                </xsl:for-each>
            </ul>
        </xsl:if>
        <hr/>
        <table class="footer">
            <tr>
                <td><img src="include/logo.gif"/></td>
            </tr>
        </table>
    </body>
</html>
</xsl:template>

</xsl:stylesheet>
