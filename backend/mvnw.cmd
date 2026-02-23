@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF)
@REM Maven Wrapper start up batch script
@REM ----------------------------------------------------------------------------

@IF "%__MVNW_ARG0_OK%"=="" (SET __MVNW_ARG0_OK=TRUE & GOTO :__MVNW_ARG0_OK)
:__MVNW_ARG0_OK

@setlocal
set MVNW_REPOURL=https://repo.maven.apache.org/maven2
set WRAPPER_JAR="%~dp0.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_URL=%MVNW_REPOURL%/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar

@IF NOT EXIST %WRAPPER_JAR% (
    powershell -Command "&{"^
        $webclient = new-object System.Net.WebClient;"^
        if (-not ([string]::IsNullOrEmpty('%MVNW_USERNAME%') -and [string]::IsNullOrEmpty('%MVNW_PASSWORD%'))) {"^
            $webclient.Credentials = new-object System.Net.NetworkCredential('%MVNW_USERNAME%', '%MVNW_PASSWORD%');"^
        }"^
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $webclient.DownloadFile('%WRAPPER_URL%', '%WRAPPER_JAR%')"^
    "}"
    if %ERRORLEVEL% neq 0 goto error
)

@set MAVEN_PROJECTBASEDIR=%~dp0

@set MAVEN_CMD_LINE_ARGS=%*

%JAVA_HOME%\bin\java.exe ^
  %MAVEN_OPTS% ^
  -classpath %WRAPPER_JAR% ^
  org.apache.maven.wrapper.MavenWrapperMain ^
  %MAVEN_CMD_LINE_ARGS%

if ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%
exit /B %ERROR_CODE%
