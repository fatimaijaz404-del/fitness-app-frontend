import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null); // yeh yaad rakhega kaun login hai

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Dashboard ke liye states
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [logs, setLogs] = useState([]);

  const handleSignup = async () => {
    try {
      const response = await fetch('https://fitness-app-backend-production-07df.up.railway.app/api/signup', {
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
      const response = await fetch('https://fitness-app-backend-production-07df.up.railway.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setLoggedInUser(data.user); // user ko yaad rakh lo
        setMessage('');
      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    }
  };

  // Calorie entry add karna
  const handleAddCalorie = async () => {
    try {
      const response = await fetch('https://fitness-app-backend-production-07df.up.railway.app/api/calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser.id,
          foodName,
          calories,
        }),
      });

      if (response.ok) {
        setFoodName('');
        setCalories('');
        fetchLogs(); // list ko refresh kar do
      }
    } catch (error) {
      console.log('Error adding calorie:', error);
    }
  };

  // Saari entries fetch karna
  const fetchLogs = async () => {
    try {
      const response = await fetch(`https://fitness-app-backend-production-07df.up.railway.app/api/calories/${loggedInUser.id}`);
      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.log('Error fetching logs:', error);
    }
  };

  // Jab user login ho jaye, uski entries load kar lo
  useEffect(() => {
    if (loggedInUser) {
      fetchLogs();
    }
  }, [loggedInUser]);

  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);

  const handleLogout = () => {
    setLoggedInUser(null);
    setEmail('');
    setPassword('');
    setLogs([]);
  };

  // ---- AGAR USER LOGIN HAI, DASHBOARD DIKHAO ----
  if (loggedInUser) {
    return (
      <div className="app-container">
        <div className="card dashboard-card">
          <h1 className="brand-title">thri<span>ve</span></h1>
          <p className="brand-subtitle">Welcome, {loggedInUser.name}!</p>

          <h2 className="form-title">Add Calorie Entry</h2>

          <input
            className="input-field"
            type="text"
            placeholder="Food name (e.g. Chicken Biryani)"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
          />
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

          <button className="switch-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  // ---- AGAR USER LOGIN NAHI HAI, SIGNUP/LOGIN FORM DIKHAO ----
  return (
    <div className="app-container">
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
