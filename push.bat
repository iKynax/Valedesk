@echo off
if "%~1"=="" (
    set msg=update
) else (
    set msg=%~1
)

echo Adding changes...
git add .
echo.

echo Committing with message: "%msg%"
git commit -m "%msg%"
echo.

echo Pushing to GitHub...
git push
echo.

echo Done!
