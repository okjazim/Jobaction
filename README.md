# JobAction - Job Board Platform
**JobAction** is a job board platform where job seekers can search, apply, and save jobs, while employers can post listings and manage applications.

The frontend is built using **HTML**, **CSS**, and **JavaScript**, with a simple, responsive design. The backend is developed in **Python (Flask)** to handle routing, job operations, and **API** endpoints. Supabase is used for data storage and user management, with its built-in **JWT-based authentication** ensuring secure logins and protected routes. All client–server communication happens through **RESTful API** requests using the native fetch **API**.

## 📁 File Structure
- `home.html` - Landing page with authentication forms
- `jobs.html` - Job browsing and search page
- `dashboard.html` - User dashboard for managing jobs and applications
- `index.html` - Alternative entry point (same as home.html)

## 🚀 Features
- User authentication (signup/login)
- Job posting and management
- Job search and filtering
- Job applications
- Job saving/bookmarking
- Dashboard with user-specific data
- Responsive design
- Professional UI with Font Awesome icons

## 📋 Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. **Important**: Go to **Authentication → Settings** and:
   - Disable **"Enable email confirmations"** (this allows immediate login after signup)
   - Optionally, you can also disable **"Enable email change confirmations"**
3. Go to **Settings → API** to get your project URL and anon key
4. Create a `.env` file in the project root:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
FLASK_SECRET_KEY=your-secret-key-here
```

### 3. Set up Database
Run the SQL in `supabase_setup.sql` in your Supabase SQL Editor:
- Go to your Supabase dashboard
- Navigate to SQL Editor
- Copy and paste the contents of `supabase_setup.sql`
- Click "Run"

### 4. Run the Application
```bash
python app.py
```

Then open `http://localhost:5000/home.html` in your browser.

## 🔧 Troubleshooting Login Issues

If you get "Invalid login credentials":

1. **Check Supabase Settings**: Make sure email confirmations are disabled in Authentication → Settings
2. **Check Console Logs**: The Flask app will show debug logs for signup/login attempts
3. **Verify User Creation**: Check Supabase Dashboard → Authentication → Users to see if your account was created
4. **Try Different Email**: Some email providers may be blocked by Supabase
5. **Check Password**: Make sure you're using the exact same password for both signup and login

## License
This project is licensed under the **MIT License**.
See [`LICENSE`](LICENSE) for details. © 2026 okjazim
