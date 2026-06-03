import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from backend.routes import register_routes

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
CORS(app)
load_dotenv(os.path.join(ROOT_DIR, ".env"))

register_routes(app)

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

  
