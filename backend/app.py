import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from routes import register_routes

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
# Allow requests from the production frontend domain and local dev servers
allowed_origins = [
    "https://notes-by-sakshi.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
]
CORS(app, origins=allowed_origins, supports_credentials=True)
load_dotenv(os.path.join(ROOT_DIR, ".env"))

register_routes(app)
@app.route("/")
def home():
    return {
        "status": "success",
        "message": "Backend is running"
    }

@app.route("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "app": "Notes Library",
        "version": "1.0.0"
    })

app=app





if __name__ == "__main__":
    app.run(debug=True, port=5000)

  
