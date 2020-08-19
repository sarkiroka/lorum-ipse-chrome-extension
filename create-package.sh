#!/bin/bash

echo "create package for chrome store..."
if [ -f "lorum-ipse-chrome-extension.zip" ]; then
	rm lorum-ipse-chrome-extension.zip
fi
zip -9 lorum-ipse-chrome-extension.zip generate-lorum-ipse-text.js lorum-ipse*.png lorum-ipse-content-script.js manifest.json
echo "package created!"
