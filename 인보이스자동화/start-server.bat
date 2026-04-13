@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Invoice AutoPilot - local server

where python >nul 2>&1
if %errorlevel%==0 goto :py

where py >nul 2>&1
if %errorlevel%==0 goto :pylauncher

where node >nul 2>&1
if %errorlevel%==0 goto :node

goto :noengine

:py
echo.
echo  [Invoice AutoPilot] 서버가 켜졌습니다.
echo  브라우저 주소창에 입력:  http://localhost:8080
echo  (이 검은 창을 닫으면 서버가 꺼집니다.)
echo.
start "" "http://localhost:8080/"
python -m http.server 8080
goto :end

:pylauncher
echo.
echo  [Invoice AutoPilot] 서버가 켜졌습니다.
echo  브라우저 주소창에 입력:  http://localhost:8080
echo  (이 검은 창을 닫으면 서버가 꺼집니다.)
echo.
start "" "http://localhost:8080/"
py -3 -m http.server 8080
goto :end

:node
echo.
echo  [Invoice AutoPilot] Node로 서버 실행 중... (처음이면 잠시 다운로드가 있을 수 있습니다)
echo  브라우저 주소창에 입력:  http://localhost:8080
echo  (이 검은 창을 닫으면 서버가 꺼집니다.)
echo.
start "" "http://localhost:8080/"
npx --yes serve -l 8080 .
goto :end

:noengine
echo.
echo  [안내] 이 PC에 Python / Node.js 가 없어 자동 서버를 켤 수 없습니다.
echo.
echo  --- 방법 1 (가장 간단) ---
echo    이 폴더에서 "index.html" 을 더블클릭해 브라우저로 여세요.
echo    (이 프로젝트는 대부분 이 방식으로 동작합니다.)
echo.
echo  --- 방법 2 ---
echo    Microsoft Store 또는 python.org 에서 Python 설치 후
echo    이 파일(start-server.bat)을 다시 더블클릭하세요.
echo.
echo  --- 방법 3 (회사 담당자) ---
echo    폴더 전체를 사내 웹 서버나 Netlify Drop 등에 올리면
echo    설치 없이 URL만으로 테스트할 수 있습니다.
echo.
pause

:end
