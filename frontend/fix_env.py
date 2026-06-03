import os
import glob

frontend_dir = "/Users/apple/Desktop/Notes1/frontend/js"
files_to_update = ["admin.js", "dashboard.js", "main.js"]

for filename in files_to_update:
    filepath = os.path.join(frontend_dir, filename)
    with open(filepath, "r") as f:
        content = f.read()

    # Replace import.meta.env.VITE_API_URL with window.API_BASE_URL
    content = content.replace("import.meta.env.VITE_API_URL", "window.API_BASE_URL")
    
    with open(filepath, "w") as f:
        f.write(content)

print("Updated JS files to use window.API_BASE_URL")
