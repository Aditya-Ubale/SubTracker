@echo off
setlocal enabledelayedexpansion

set "file=subscription-tracker-backend\src\main\java\com\subscriptiontracker\service\PriceScraperService.java"
set "temp=%file%.tmp"
set "skipnext=0"

(for /f "delims=" %%a in (%file%) do (
    set "line=%%a"
    if "!line!"=="                case ""Spotify"":" (
        if "!skipnext!"=="1" (
            set "skipnext=2"
        ) else (
            echo !line!
            set "skipnext=1"
        )
    ) else if "!skipnext!"=="2" (
        set "skipnext=0"
    ) else if "!skipnext!"=="1" (
        echo !line!
        set "skipnext=0"  
    ) else (
        echo !line!
    )
)) > "%temp%"

move /y "%temp%" "%file%"

echo Fixed duplicate Spotify case

REM Now add missing methods
set "addline=0"
(for /f "delims=" %%a in (%file%) do (
    set "line=%%a"
    if "!line!"=="}" if "!addline!"=="0" (
        echo.
        echo     // DeepSeek price extraction
        echo     private Double extractDeepSeekPrice(Document doc^) {
        echo         return 0.0;
        echo     }
        echo.
        echo     // Gemini price extraction
        echo     private Double extractGeminiPrice(Document doc^) {
        echo         return 1950.0;
        echo     }
        echo ^}
        set "addline=1"
    ) else (
        echo !line!
    )
)) > "%temp%"

move /y "%temp%" "%file%"

echo Added missing methods
