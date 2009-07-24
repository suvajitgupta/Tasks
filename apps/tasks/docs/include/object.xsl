<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="2.0"
    xmlns="http://www.w3.org/1999/xhtml">
<xsl:output method="xml" indent="yes"/>

<!-- object template -->
<xsl:template match="object">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <title>Tasks Project API: <xsl:value-of select="@name"/></title>
        <link href="include/api.css" rel="stylesheet" type="text/css"/>
        <script language="javascript" src="include/api.js"></script>
    </head>
    <body>
        <table class="nav">
            <tr>
                <td>
                    <a class="nav" href="index.xml">API Index</a> |
                    <xsl:value-of select="@name"/>
                </td>
            </tr>
        </table>
        <h1><xsl:value-of select="@name"/> Object</h1>

        <!-- description/logo -->
        <table class="header">
            <tr>    
                <td class="header">
                    <div class="para">
                        <xsl:call-template name="replaceNewlines">
                            <xsl:with-param name="string"
                                select="description"/>
                        </xsl:call-template>
                        <p/>
                        <xsl:if test="@since">
                            <p><b>Since:</b>&#160;<xsl:value-of select="@since"/></p>
                        </xsl:if>
                    </div>
                </td>
                <td class="logo">
                    <img src="include/logo.jpg"/>
                </td>
            </tr>   
        </table> 

        <!-- elements -->
        <xsl:if test="element">
            <xsl:for-each select="element">
                <xsl:call-template name="subHeader">
                    <xsl:with-param name="title"><xsl:value-of select="@name"/></xsl:with-param>
                    <xsl:with-param name="element">element<xsl:value-of select="position()"/></xsl:with-param>
                </xsl:call-template>

                <!-- attributes -->
                <xsl:if test="attribute">
                    <xsl:variable name="elementNum" select="position()"/>
                    <div class="indent" id="element{$elementNum}">
                        <h3>Attributes</h3>
                        <div class="list">
                            <ul>
                                <xsl:for-each select="attribute">
                                    <li><b><xsl:value-of select="@name"/></b>
                                    &#160;[<xsl:value-of select="@type"/>
                                    <xsl:choose>
                                        <xsl:when test="valid">
                                            (<xsl:for-each select="valid">
                                                <xsl:value-of select="text()"/>
                                                <xsl:if test="position() != last()"> | </xsl:if>
                                            </xsl:for-each>)]
                                        </xsl:when>
                                        <xsl:otherwise>]</xsl:otherwise>
                                    </xsl:choose>
                                    </li>
                                    <span class="indent">
                                        <xsl:call-template name="replaceNewlines">
                                            <xsl:with-param name="string" select="text()"/>
                                        </xsl:call-template>
                                    </span>
                                    <xsl:if test="position() != last()"><br/></xsl:if>
                                </xsl:for-each>
                            </ul>
                        </div>
                        <xsl:if test="format">
                            <h3>JSON Format</h3>
                            <pre><xsl:value-of select="format"/></pre>
                        </xsl:if>
                        <xsl:if test="example">
                            <h3>JSON Example</h3>
                            <pre><xsl:value-of select="example"/></pre>
                        </xsl:if>
                    </div>
                </xsl:if>
            </xsl:for-each>
        </xsl:if>

        <!-- see also -->
        <xsl:if test="see">
            <xsl:call-template name="subHeader">
                <xsl:with-param name="title">See Also</xsl:with-param>
                <xsl:with-param name="element">see</xsl:with-param>
            </xsl:call-template>
            <div class="list" id="see">
                <ul>
                    <xsl:for-each select="see">
                        <xsl:variable name="file" select="@file"/>
                        <li><a href="{$file}"><xsl:value-of select="@name"/></a></li>
                    </xsl:for-each>
                </ul>
            </div>
        </xsl:if>

    </body>
</html>
</xsl:template>

<!-- newline-replacement template -->
<xsl:template name="replaceNewlines">
    <xsl:param name="string"/>
    <xsl:choose>
        <xsl:when test="contains($string, '&#10;&#10;')">
            <xsl:value-of select="substring-before($string, '&#10;&#10;')"/>
            <br/><br/>
            <xsl:call-template name="replaceNewlines">
                <xsl:with-param name="string"
                    select="substring-after($string, '&#10;&#10;')"/>
            </xsl:call-template>
        </xsl:when>
        <xsl:otherwise>
            <xsl:value-of select="$string"/>
        </xsl:otherwise>
    </xsl:choose>
</xsl:template>

<!-- sub-header template -->
<xsl:template name="subHeader">
    <xsl:param name="title">Undefined</xsl:param>
    <xsl:param name="element">undef</xsl:param>
    <table class="subHeader">
        <tr>
            <td class="subHeader" id="{$element}Header"><xsl:value-of select="$title"/></td>
            <td class="collapse">
                <a class="collapse" href="javascript:showHide('{$element}');"
                    id="x{$element}">[-]</a>
            </td>
        </tr>
    </table>
</xsl:template>

</xsl:stylesheet>
