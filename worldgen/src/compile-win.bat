@echo off
cls
pyinstaller --onefile --add-data="assets/scripts;assets/scripts" main.py
mkdir dist\assets
xcopy /E /I assets\names dist\assets\names\
rmdir /S /Q build
del main.spec
ren dist build-win