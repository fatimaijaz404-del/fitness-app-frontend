import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import './App.css';

const API_BASE = 'https://fitness-app-backend-production-07df.up.railway.app';

function App() {
  const [view, setView] = useState('home'); // 'home' | 'auth'
  const [isLogin, setIsLogin] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('calories'); // 'calories' | 'exercise' | 'progress'

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Calorie states
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [logs, setLogs] = useState([]);
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const suggestionTimer = useRef(null);

  // Exercise states
  const [exerciseName, setExerciseName] = useState('');
  const [duration, setDuration] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [exerciseLogs, setExerciseLogs] = useState([]);

  const handleSignup = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Signup successful! You can now login.');
      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setLoggedInUser(data.user);
        setMessage('');
      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    }
  };

  // ---- Calorie logic ----
  const handleAddCalorie = async () => {
    if (!foodName || !calories) return;
    try {
      const response = await fetch(`${API_BASE}/api/calories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser.id, foodName, calories }),
      });
      if (response.ok) {
        setFoodName('');
        setCalories('');
        setFoodSuggestions([]);
        fetchLogs();
      }
    } catch (error) {
      console.log('Error adding calorie:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/calories/${loggedInUser.id}`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.log('Error fetching logs:', error);
    }
  };

  const handleFoodNameChange = (val) => {
    setFoodName(val);
    if (suggestionTimer.current) clearTimeout(suggestionTimer.current);

    if (!val.trim()) {
      setFoodSuggestions([]);
      return;
    }

    suggestionTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/foods/search?q=${encodeURIComponent(val)}`);
        const data = await response.json();
        setFoodSuggestions(data.results || []);
      } catch (error) {
        console.log('Error fetching suggestions:', error);
      }
    }, 250);
  };

  const selectSuggestion = (food) => {
    setFoodName(food.name);
    setCalories(String(food.calories));
    setFoodSuggestions([]);
  };

  // ---- Exercise logic ----
  const handleAddExercise = async () => {
    if (!exerciseName || !duration || !caloriesBurned) return;
    try {
      const response = await fetch(`${API_BASE}/api/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser.id,
          exerciseName,
          duration,
          caloriesBurned,
        }),
      });
      if (response.ok) {
        setExerciseName('');
        setDuration('');
        setCaloriesBurned('');
        fetchExerciseLogs();
      }
    } catch (error) {
      console.log('Error adding exercise:', error);
    }
  };

  const fetchExerciseLogs = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/exercises/${loggedInUser.id}`);
      const data = await response.json();
      setExerciseLogs(data.logs || []);
    } catch (error) {
      console.log('Error fetching exercise logs:', error);
    }
  };

  useEffect(() => {
    if (loggedInUser) {
      fetchLogs();
      fetchExerciseLogs();
    }
  }, [loggedInUser]);

  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);
  const totalBurned = exerciseLogs.reduce((sum, log) => sum + log.caloriesBurned, 0);

  const handleLogout = () => {
    setLoggedInUser(null);
    setEmail('');
    setPassword('');
    setLogs([]);
    setExerciseLogs([]);
    setView('home');
    setDashboardTab('calories');
  };

  const goToLogin = () => {
    setIsLogin(true);
    setMessage('');
    setView('auth');
  };

  const goToSignup = () => {
    setIsLogin(false);
    setMessage('');
    setView('auth');
  };

  const goHome = () => {
    setView('home');
    setMessage('');
  };

  // ---- Weekly chart data (last 7 days) ----
  const getWeeklyChartData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({ key, label, consumed: 0, burned: 0 });
    }

    logs.forEach((log) => {
      const key = new Date(log.date).toISOString().slice(0, 10);
      const day = days.find((d) => d.key === key);
      if (day) day.consumed += log.calories;
    });

    exerciseLogs.forEach((log) => {
      const key = new Date(log.date).toISOString().slice(0, 10);
      const day = days.find((d) => d.key === key);
      if (day) day.burned += log.caloriesBurned;
    });

    return days;
  };

  // ---- NAVBAR ----
  const Navbar = () => (
    <nav className="navbar">
      <div className="nav-logo" onClick={goHome}>
        thri<span>ve</span>
      </div>
      <div className="nav-links">
        <button className="nav-btn nav-btn-ghost" onClick={goToLogin}>Login</button>
        <button className="nav-btn nav-btn-solid" onClick={goToSignup}>Sign Up</button>
      </div>
    </nav>
  );

  // ---- DASHBOARD (logged in) ----
  if (loggedInUser) {
    const chartData = getWeeklyChartData();

    return (
      <div className="app-container">
        <div className="card dashboard-card">
          <h1 className="brand-title">thri<span>ve</span></h1>
          <p className="brand-subtitle">Welcome, {loggedInUser.name}!</p>

          <div className="tabs">
            <button
              className={`tab-btn ${dashboardTab === 'calories' ? 'tab-active' : ''}`}
              onClick={() => setDashboardTab('calories')}
            >
              Calories
            </button>
            <button
              className={`tab-btn ${dashboardTab === 'exercise' ? 'tab-active' : ''}`}
              onClick={() => setDashboardTab('exercise')}
            >
              Exercise
            </button>
            <button
              className={`tab-btn ${dashboardTab === 'progress' ? 'tab-active' : ''}`}
              onClick={() => setDashboardTab('progress')}
            >
              Progress
            </button>
          </div>

          {dashboardTab === 'calories' && (
            <>
              <h2 className="form-title">Add Calorie Entry</h2>

              <div className="autocomplete-wrap">
                <input
                  className="input-field"
                  type="text"
                  placeholder="Food name (e.g. Chicken Biryani)"
                  value={foodName}
                  onChange={(e) => handleFoodNameChange(e.target.value)}
                  autoComplete="off"
                />
                {foodSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {foodSuggestions.map((food, idx) => (
                      <div
                        key={idx}
                        className="suggestion-item"
                        onClick={() => selectSuggestion(food)}
                      >
                        <span>{food.name}</span>
                        <span className="suggestion-cal">{food.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input
                className="input-field"
                type="number"
                placeholder="Calories"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
              <button className="primary-btn" onClick={handleAddCalorie}>
                Add Entry
              </button>

              <div className="total-box">
                Total Today: <strong>{totalCalories} kcal</strong>
              </div>

              <div className="logs-list">
                {logs.map((log) => (
                  <div key={log._id} className="log-item">
                    <span>{log.foodName}</span>
                    <span>{log.calories} kcal</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {dashboardTab === 'exercise' && (
            <>
              <h2 className="form-title">Add Exercise</h2>

              <input
                className="input-field"
                type="text"
                placeholder="Exercise name (e.g. Running)"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
              />
              <input
                className="input-field"
                type="number"
                placeholder="Duration (minutes)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <input
                className="input-field"
                type="number"
                placeholder="Calories burned"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
              />
              <button className="primary-btn" onClick={handleAddExercise}>
                Add Exercise
              </button>

              <div className="total-box">
                Burned Today: <strong>{totalBurned} kcal</strong>
              </div>

              <div className="logs-list">
                {exerciseLogs.map((log) => (
                  <div key={log._id} className="log-item">
                    <span>{log.exerciseName} ({log.duration} min)</span>
                    <span>{log.caloriesBurned} kcal</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {dashboardTab === 'progress' && (
            <>
              <h2 className="form-title">Weekly Progress</h2>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="consumed" name="Consumed" fill="#EC4899" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="burned" name="Burned" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="total-box">
                Net Today: <strong>{totalCalories - totalBurned} kcal</strong>
              </div>
            </>
          )}

          <button className="switch-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  // ---- HOME / LANDING PAGE ----
  if (view === 'home') {
    return (
      <div className="app-container home-container">
        <Navbar />
        <div className="hero">
          <h1 className="hero-title">
            thri<span>ve</span>
          </h1>
          <p className="hero-subtitle">Fuel your progress, one meal at a time.</p>
          <p className="hero-description">
            Track your daily calories, log your workouts, and see your weekly
            progress — all in one simple dashboard.
          </p>
          <div className="hero-actions">
            <button className="primary-btn hero-btn" onClick={goToSignup}>
              Get Started
            </button>
            <button className="nav-btn-ghost hero-btn-ghost" onClick={goToLogin}>
              I already have an account
            </button>
          </div>
        </div>

        <div className="features-section">
          <h2 className="features-heading">How thrive works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>1. Sign up</h3>
              <p>Create your free account in seconds.</p>
            </div>
            <div className="feature-card">
              <h3>2. Log your day</h3>
              <p>Track meals and workouts as you go.</p>
            </div>
            <div className="feature-card">
              <h3>3. See progress</h3>
              <p>Watch your weekly trends on one dashboard.</p>
            </div>
          </div>
        </div>

        <footer className="footer">
          <p>thrive · built with care · your fitness, tracked simply</p>
        </footer>
      </div>
    );
  }

  // ---- AUTH (login/signup form) ----
  return (
    <div className="app-container">
      <Navbar />
      <div className="card">
        <h1 className="brand-title">thri<span>ve</span></h1>
        <p className="brand-subtitle">Fuel your progress</p>

        <h2 className="form-title">{isLogin ? 'LOGIN' : 'SIGN UP'}</h2>

        {!isLogin && (
          <input
            className="input-field"
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          className="input-field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="primary-btn" onClick={isLogin ? handleLogin : handleSignup}>
          {isLogin ? 'Login' : 'Sign Up'}
        </button>

        <button className="switch-btn" onClick={() => { setIsLogin(!isLogin); setMessage(''); }}>
          {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
        </button>

        {message && <div className="message-box">{message}</div>}
      </div>
    </div>
  );
}

export default App;
