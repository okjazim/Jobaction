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

@app.get("/api/debug/users")
def debug_users():
    """Debug endpoint to check users (remove this in production)"""
    try:
        # Get all users from auth.users (limited for security)
        users = supabase.table("user_profiles").select("*").limit(10).execute()
        return jsonify({"users": users.data, "count": len(users.data)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.post("/api/auth/signup")
def signup():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400

    try:
        res = supabase.auth.sign_up({"email": email, "password": password})

        # Debug logging
        print(f"Signup response: session={bool(res.session)}, user={bool(res.user)}")

        if res.user:
            print(f"User created: {res.user.id}, {res.user.email}")

        user = res.session.user if res.session else res.user

        # Convert user object to serializable dict
        user_data = {
            "id": user.id,
            "email": user.email,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        }

        return jsonify(user_data), 201
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({"error": str(e)}), 400

@app.post("/api/auth/login")
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400

    try:
        print(f"Attempting login for: {email}")
        res = supabase.auth.sign_in_with_password({"email": email, "password": password})

        # Convert user object to serializable dict
        user_data = {
            "id": res.user.id,
            "email": res.user.email,
            "created_at": res.user.created_at,
            "updated_at": res.user.updated_at
        }

        print(f"Login successful for user: {user_data['email']}")

        # Return in the format frontend expects: { user: {...}, session: {...} }
        return jsonify({
            "user": user_data,
            "session": {
                "access_token": res.session.access_token,
                "refresh_token": res.session.refresh_token
            }
        })
    except Exception as e:
        print(f"Login failed for {email}: {e}")
        return jsonify({"error": str(e)}), 401

@app.get("/api/jobs")
def get_jobs():
    try:
        res = supabase.table("jobs").select("*").execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.post("/api/jobs")
def create_job():
    data = request.get_json() or {}
    required = ["title", "company", "location", "description"]
    if any(not data.get(k) for k in required):
        return jsonify({"error": "missing job fields"}), 400

    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        return jsonify({"error": "Authentication required"}), 401

    try:
        user = supabase.auth.get_user(token.replace("Bearer ", ""))
        user_id = user.user.id

        # Add the user ID to the job data
        data["created_by"] = user_id

        res = supabase.table("jobs").insert(data).execute()
        return jsonify(res.data), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 401


@app.delete("/api/jobs/<int:job_id>")
def delete_job(job_id: int):
    """
    Deletes a job by id, checking ownership.
    """
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        return jsonify({"error": "Authentication required"}), 401

    try:
        user = supabase.auth.get_user(token.replace("Bearer ", ""))
        user_id = user.user.id

        # Delete only if the user owns the job
        res = supabase.table("jobs").delete().eq("id", job_id).eq("created_by", user_id).execute()

        # Supabase returns an empty list if nothing deleted
        if not res.data:
            return jsonify({"error": "job not found or you don't have permission to delete it"}), 404

        return jsonify({"success": True}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.post("/api/applications")
def create_application():
    data = request.get_json() or {}
    job_id = data.get("job_id")
    if not job_id:
        return jsonify({"error": "job_id required"}), 400

    # Get user from Supabase JWT token
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        return jsonify({"error": "Authentication required"}), 401

    try:
        # Verify token and get user
        user = supabase.auth.get_user(token.replace("Bearer ", ""))
        user_id = user.user.id

        # Check if application already exists
        existing = supabase.table("applications").select("*").eq("job_id", job_id).eq("user_id", user_id).execute()
        if existing.data:
            return jsonify({"error": "Already applied to this job"}), 400

        # Create application
        res = supabase.table("applications").insert({
            "job_id": job_id,
            "user_id": user_id,
            "status": "pending"
        }).execute()

        return jsonify({"message": "Application submitted successfully", "data": res.data}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.get("/api/applications")
def get_user_applications():
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        return jsonify({"error": "Authentication required"}), 401

    try:
        user = supabase.auth.get_user(token.replace("Bearer ", ""))
        user_id = user.user.id

        res = supabase.table("applications").select("""
            *,
            jobs (
                id,
                title,
                company,
                location,
                salary
            )
        """).eq("user_id", user_id).execute()

        return jsonify(res.data)

    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.post("/api/saved-jobs")
def save_job():
    data = request.get_json() or {}
    job_id = data.get("job_id")
    if not job_id:
        return jsonify({"error": "job_id required"}), 400

    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        return jsonify({"error": "Authentication required"}), 401

    try:
        user = supabase.auth.get_user(token.replace("Bearer ", ""))
        user_id = user.user.id

        # Check if already saved
        existing = supabase.table("saved_jobs").select("*").eq("job_id", job_id).eq("user_id", user_id).execute()
        if existing.data:
            return jsonify({"error": "Job already saved"}), 400

        res = supabase.table("saved_jobs").insert({
            "job_id": job_id,
            "user_id": user_id
        }).execute()

        return jsonify({"message": "Job saved successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.delete("/api/saved-jobs/<int:job_id>")
def unsave_job(job_id):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        return jsonify({"error": "Authentication required"}), 401

    try:
        user = supabase.auth.get_user(token.replace("Bearer ", ""))
        user_id = user.user.id

        res = supabase.table("saved_jobs").delete().eq("job_id", job_id).eq("user_id", user_id).execute()

        return jsonify({"message": "Job unsaved successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.get("/api/saved-jobs")
def get_saved_jobs():
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        return jsonify({"error": "Authentication required"}), 401

    try:
        user = supabase.auth.get_user(token.replace("Bearer ", ""))
        user_id = user.user.id

        res = supabase.table("saved_jobs").select("""
            *,
            jobs (
                id,
                title,
                company,
                location,
                salary
            )
        """).eq("user_id", user_id).execute()

        return jsonify(res.data)

    except Exception as e:
        return jsonify({"error": str(e)}), 401

if __name__ == "__main__":
    app.run(debug=True, port=5000)
