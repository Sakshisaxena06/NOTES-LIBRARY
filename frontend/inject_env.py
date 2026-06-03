import os
import glob

html_files = glob.glob("**/*.html", recursive=True)

injection = '\n    <script>window.API_BASE_URL = "%VITE_API_URL%";</script>\n  </head>'

for filepath in html_files:
    if "node_modules" in filepath:
        continue
    with open(filepath, "r") as f:
        content = f.read()

    if 'window.API_BASE_URL' not in content:
        content = content.replace("</head>", injection)
        with open(filepath, "w") as f:
            f.write(content)

print("Injected env var script into HTML files.")
