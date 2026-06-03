import os
import re

frontend_dir = "/Users/apple/Desktop/Notes1/frontend/js"
files_to_update = ["admin.js", "dashboard.js", "main.js"]

for filename in files_to_update:
    filepath = os.path.join(frontend_dir, filename)
    with open(filepath, "r") as f:
        content = f.read()

    # Replace fetch("/api/...)
    # We will use regex to capture the path
    # Look for fetch("/api/ or fetch(`/api/
    # And replace with fetch(import.meta.env.VITE_API_URL + "/api/ or fetch(`${import.meta.env.VITE_API_URL}/api/
    
    # Handle backticks
    content = re.sub(r'fetch\(`\/api\/', r'fetch(`${import.meta.env.VITE_API_URL}/api/', content)
    # Handle double quotes
    content = re.sub(r'fetch\("\/api\/', r'fetch(import.meta.env.VITE_API_URL + "/api/', content)
    # Handle single quotes
    content = re.sub(r"fetch\('\/api\/", r"fetch(import.meta.env.VITE_API_URL + '/api/", content)
    
    with open(filepath, "w") as f:
        f.write(content)

print("Updated fetch calls.")
