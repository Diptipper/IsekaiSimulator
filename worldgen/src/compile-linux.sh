clear
pyinstaller --onefile --add-data="assets/scripts:assets/scripts" main.py
mkdir dist/assets
cp -R assets/names dist/assets/names/
rm -rf build
rm main.spec
mv dist build-linux