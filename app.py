from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from supabase_config import supabase

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "dev-secret")
CORS(app)

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/auth/signup")
def signup():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400

    res = supabase.auth.sign_up({"email": email, "password": password})
    if res.error:
        return jsonify({"error": str(res.error)}), 400
    return jsonify(res.data), 201

@app.post("/api/auth/login")
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400

    res = supabase.auth.sign_in_with_password({"email": email, "password": password})
    if res.error:
        return jsonify({"error": str(res.error)}), 401
    return jsonify(res.data)

@app.get("/api/jobs")
def get_jobs():
    res = supabase.table("jobs").select("*").execute()
    if res.error:
        return jsonify({"error": str(res.error)}), 500
    return jsonify(res.data)

@app.post("/api/jobs")
def create_job():
    data = request.get_json() or {}
    required = ["title", "company", "location", "description"]
    if any(not data.get(k) for k in required):
        return jsonify({"error": "missing job fields"}), 400

    res = supabase.table("jobs").insert(data).execute()
    if res.error:
        return jsonify({"error": str(res.error)}), 500
    return jsonify(res.data), 201

if __name__ == "__main__":
    app.run(debug=True, port=5000)
