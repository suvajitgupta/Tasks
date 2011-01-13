<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="2.0"
    xmlns="http://www.w3.org/1999/xhtml">
<xsl:output method="xml" indent="yes"/>

<!-- resource template -->
<xsl:template match="resource">
<xsl:variable name="includeFile">../<xsl:value-of select="@include"/></xsl:variable>
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
        <h1><xsl:value-of select="@name"/> Resource</h1>

        <!-- description/logo -->
        <table class="header">
            <tr>    
                <td class="header">
                    <div class="para">
                        <xsl:call-template name="replaceNewlines">
                            <xsl:with-param name="string" select="description"/>
                        </xsl:call-template>
                        <p/>
                        <xsl:if test="@since">
                            <p><b>Since:</b>&#160;<xsl:value-of select="@since"/></p>
                        </xsl:if>
                    </div>
                </td>
            </tr>   
        </table> 
        <p>&#160;[
            <xsl:if test="endpoint"><a href="#endpointsHeader">Service Endpoints</a></xsl:if>
            <xsl:if test="element or document($includeFile)//element"> |
                <a href="#elementsHeader">Path Elements</a></xsl:if>
            <xsl:if test="parameter or document($includeFile)//parameter"> |
                <a href="#parametersHeader">Query Parameters</a></xsl:if>
            <xsl:if test="header or document($includeFile)//header"> |
                <a href="#headersHeader">HTTP Headers</a></xsl:if>
            <xsl:if test="attribute or document($includeFile)//attribute"> |
                <a href="#attributesHeader">Attributes</a></xsl:if>
            <xsl:if test="code or document($includeFile)//code"> |
                <a href="#codesHeader">Response Codes</a></xsl:if>
            <xsl:if test="request"> | <a href="#requestHeader">Request Body</a></xsl:if>
            <xsl:if test="response"> | <a href="#responseHeader">Response Body</a></xsl:if>
            <xsl:if test="see"> | <a href="#seeHeader">See Also</a></xsl:if>
        ]</p>

        <!-- endpoints -->
        <xsl:if test="endpoint">
            <xsl:call-template name="subHeader">
                <xsl:with-param name="title">Service Endpoints</xsl:with-param>
                <xsl:with-param name="element">endpoints</xsl:with-param>
            </xsl:call-template>
            <div class="para" id="endpoints">
                <xsl:for-each select="endpoint">
                    <p>
                        <span class="code">
                            <xsl:value-of select="@method"/>&#160;<xsl:value-of select="@uri"/>
                        </span>
                        <br/>
                        <span class="indent">
                            <xsl:call-template name="replaceNewlines">
                                <xsl:with-param name="string" select="text()"/>
                            </xsl:call-template>
                        </span>
                    </p>
                </xsl:for-each>
            </div>
        </xsl:if>

        <!-- elements -->
        <xsl:if test="element or document($includeFile)//element">
            <xsl:call-template name="subHeader">
                <xsl:with-param name="title">Path Elements</xsl:with-param>
                <xsl:with-param name="element">elements</xsl:with-param>
            </xsl:call-template>
            <div class="list" id="elements">
                <ul>
                    <xsl:apply-templates select="document($includeFile)//element"/>
                    <xsl:apply-templates select="element"/>
                </ul>
            </div>
        </xsl:if> 

        <!-- query parameters -->
        <xsl:if test="parameter or document($includeFile)//parameter">
            <xsl:call-template name="subHeader">
                <xsl:with-param name="title">Query Parameters</xsl:with-param>
                <xsl:with-param name="element">parameters</xsl:with-param>
            </xsl:call-template>
            <div class="list" id="parameters">
                <ul>
                    <xsl:apply-templates select="document($includeFile)//parameter"/>
                    <xsl:apply-templates select="parameter"/>
                </ul>
            </div>
        </xsl:if>

        <!-- http headers -->
        <xsl:if test="header or document($includeFile)//header">
            <xsl:call-template name="subHeader">
                <xsl:with-param name="title">HTTP Headers</xsl:with-param>
                <xsl:with-param name="element">headers</xsl:with-param>
            </xsl:call-template>
            <div class="list" id="headers">
                <ul>
                    <xsl:apply-templates select="document($includeFile)//header"/>
                    <xsl:apply-templates select="header"/>
                </ul>
            </div>
        </xsl:if>

        <!-- attributes -->
        <xsl:if test="attribute or document($includeFile)//attribute">
            <xsl:call-template name="subHeader">
                <xsl:with-param name="title">Attributes</xsl:with-param>
                <xsl:with-param name="element">attributes</xsl:with-param>
            </xsl:call-template>
            <div class="list" id="attributes">
                <ul>
                    <xsl:apply-templates select="document($includeFile)//attribute"/>
                    <xsl:apply-templates select="attribute"/>
                </ul>
            </div>
        </xsl:if>

        <!-- response codes -->
        <xsl:if test="code or document($includeFile)//code">
            <xsl:call-template name="subHeader">
                <xsl:with-param name="title">Response Codes</xsl:with-param>
                <xsl:with-param name="element">codes</xsl:with-param>
            </xsl:call-template>
            <div class="list" id="codes">
                <ul>
                    <xsl:apply-templates select="document($includeFile)//code"/>
                    <xsl:apply-templates select="code"/>
                </ul>
            </div>
        </xsl:if>

        <!-- request body -->
        <xsl:if test="request">
            <div id="requestHeader"/>
            <xsl:for-each select="request">
                <xsl:variable name="type" select="@type"/>
                <xsl:call-template name="subHeader">
                    <xsl:with-param name="title">Request Body
                        (<xsl:value-of select="$type"/>)</xsl:with-param>
                    <xsl:with-param name="element">request_<xsl:value-of select="@type"/></xsl:with-param>
                </xsl:call-template>
                <div class="para" id="request_{$type}">
                    <p><xsl:value-of select="text()"/></p>
                    <xsl:if test="format">
                        <xsl:if test="format/@type">
                            <h3><xsl:value-of select="format/@type"/> Format</h3>
                        </xsl:if>
                        <pre><xsl:value-of select="format"/></pre>
                    </xsl:if>
                    <xsl:if test="example">
                        <xsl:if test="example/@type">
                            <h3><xsl:value-of select="example/@type"/> Example</h3>
                        </xsl:if>
                        <pre><xsl:value-of select="example"/></pre>
                    </xsl:if>
                </div>
            </xsl:for-each>
        </xsl:if>

        <!-- response body -->
        <xsl:if test="response">
            <div id="responseHeader"/>
            <xsl:for-each select="response">
                <xsl:variable name="type" select="@type"/>
                <xsl:call-template name="subHeader">
                    <xsl:with-param name="title">Response Body
                        (<xsl:value-of select="$type"/>)</xsl:with-param>
                    <xsl:with-param name="element">response_<xsl:value-of select="@type"/></xsl:with-param>
                </xsl:call-template>
                <div class="para" id="response_{$type}">
                    <p><xsl:value-of select="text()"/></p>
                    <xsl:if test="format">
                        <xsl:if test="format/@type">
                            <h3><xsl:value-of select="format/@type"/> Format</h3>
                        </xsl:if>
                        <pre><xsl:value-of select="format"/></pre>
                    </xsl:if>
                    <xsl:if test="example">
                        <xsl:if test="example/@type">
                            <h3><xsl:value-of select="example/@type"/> Example</h3>
                        </xsl:if>
                        <pre><xsl:value-of select="example"/></pre>
                    </xsl:if>
                </div>
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

<!-- element template -->
<xsl:template match="element">
    <li><b><xsl:value-of select="@name"/></b>
    &#160;[<xsl:value-of select="@type"/>
    <xsl:choose>
        <xsl:when test="valid">
            (<xsl:for-each select="valid">
                <xsl:value-of select="text()"/>
                <xsl:if test="position() != last()"> | </xsl:if>
             </xsl:for-each>),
        </xsl:when>
        <xsl:otherwise>, </xsl:otherwise>
    </xsl:choose>
    <xsl:choose>
        <xsl:when test="@required='yes'">required</xsl:when>
        <xsl:otherwise>optional, default=<xsl:value-of select="@default"/></xsl:otherwise>
    </xsl:choose>]</li>
    <span class="indent">
        <xsl:call-template name="replaceNewlines">
            <xsl:with-param name="string" select="text()"/>
        </xsl:call-template>
    </span>
</xsl:template>

<!-- parameter template -->
<xsl:template match="parameter">
    <li><b><xsl:value-of select="@name"/></b>
    &#160;[<xsl:value-of select="@type"/>
    <xsl:choose>
        <xsl:when test="valid">
            (<xsl:for-each select="valid">
                <xsl:value-of select="text()"/>
                <xsl:if test="position() != last()"> | </xsl:if>
            </xsl:for-each>),
        </xsl:when>
        <xsl:otherwise>, </xsl:otherwise>
    </xsl:choose>
    <xsl:choose>
        <xsl:when test="@required='yes'">required</xsl:when>
        <xsl:otherwise>optional, default=<xsl:value-of select="@default"/></xsl:otherwise>
    </xsl:choose>]</li>
    <span class="indent">
        <xsl:call-template name="replaceNewlines">
            <xsl:with-param name="string" select="text()"/>
        </xsl:call-template>
    </span>
</xsl:template>

<!-- header template -->
<xsl:template match="header">
    <li><b><xsl:value-of select="@name"/></b>
    &#160;[<xsl:value-of select="@type"/>
    <xsl:choose>
        <xsl:when test="valid">
            (<xsl:for-each select="valid">
                 <xsl:value-of select="text()"/>
                 <xsl:if test="position() != last()"> | </xsl:if>
            </xsl:for-each>),
        </xsl:when>
        <xsl:otherwise>, </xsl:otherwise>
    </xsl:choose>
    <xsl:choose>
        <xsl:when test="@required='yes'">required</xsl:when>
        <xsl:otherwise>optional</xsl:otherwise>
    </xsl:choose>
    <xsl:choose>
        <xsl:when test="method">
            (<xsl:for-each select="method">
                <xsl:value-of select="text()"/>
                <xsl:if test="position() != last()">, </xsl:if>
            </xsl:for-each>)<xsl:if test="@default">,default=<xsl:value-of select="@default"/></xsl:if>
        </xsl:when>
        <xsl:otherwise>
            <xsl:if test="@default">default=<xsl:value-of select="@default"/></xsl:if>
        </xsl:otherwise>
    </xsl:choose>]</li>
    <span class="indent">
        <xsl:call-template name="replaceNewlines">
            <xsl:with-param name="string" select="text()"/>
        </xsl:call-template>
    </span>
</xsl:template>

<!-- attribute template -->
<xsl:template match="attribute">
    <li><b><xsl:value-of select="@name"/></b>
    &#160;[<xsl:if test="@read-only = 'true'">read-only </xsl:if>
    <xsl:value-of select="@type"/>
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
</xsl:template>

<!-- response code template -->
<xsl:template match="code">
    <li><b><xsl:value-of select="@number"/></b>&#160;
    <xsl:call-template name="replaceNewlines">
        <xsl:with-param name="string" select="text()"/>
    </xsl:call-template>
    <xsl:if test="method">&#160;[<xsl:for-each select="method">
        <xsl:value-of select="text()"/>
        <xsl:if test="position() != last()">, </xsl:if>
    </xsl:for-each>]</xsl:if></li>
</xsl:template>

</xsl:stylesheet>
