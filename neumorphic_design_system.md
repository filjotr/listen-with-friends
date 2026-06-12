# Neumorphic (Soft UI) Design System

This document outlines the variables, mixins, and markup required to transition the application's user interface to a premium **Neumorphic (Soft UI)** design language supporting both **Light Mode** and **Dark Mode** seamlessly via a single CSS theme toggle.

---

## 🎨 Core Color Palette & Shadows

Neumorphism relies on subtle gradients and dual shadows. The shadows are relative to the background color. To support both light and dark themes dynamically, we use CSS Custom Properties mapped to SCSS variables.

### 1. SCSS Variables & Theme Configuration

```scss
// Base Theme Definitions (variables.scss)
:root {
  // Light Mode Variables (Base background: #e0e5ec)
  --base-bg: #e0e5ec;
  --text-main: #31344b;
  --text-muted: #62667f;
  
  // Accents
  --accent-cyan: #00bcd4;
  --accent-pink: #e91e63;
  --accent-cyan-glow: rgba(0, 188, 212, 0.25);
  
  // Shadows (Light Neumorphic)
  --shadow-flat-dark: 9px 9px 16px rgba(163, 177, 198, 0.6);
  --shadow-flat-light: -9px -9px 16px rgba(255, 255, 255, 0.8);
  
  --shadow-inset-dark: inset 3px 3px 7px rgba(163, 177, 198, 0.65);
  --shadow-inset-light: inset -3px -3px 7px rgba(255, 255, 255, 0.85);

  --shadow-button-hover-dark: 4px 4px 8px rgba(163, 177, 198, 0.6);
  --shadow-button-hover-light: -4px -4px 8px rgba(255, 255, 255, 0.8);
}

[data-theme="dark"] {
  // Dark Mode Variables (Base background: #1f232d)
  --base-bg: #1f232d;
  --text-main: #e2e8f0;
  --text-muted: #94a3b8;
  
  // Accents
  --accent-cyan: #00f0ff;
  --accent-pink: #ff007a;
  --accent-cyan-glow: rgba(0, 240, 255, 0.15);
  
  // Shadows (Dark Neumorphic)
  --shadow-flat-dark: 9px 9px 18px rgba(0, 0, 0, 0.55);
  --shadow-flat-light: -9px -9px 18px rgba(255, 255, 255, 0.04);
  
  --shadow-inset-dark: inset 4px 4px 8px rgba(0, 0, 0, 0.6);
  --shadow-inset-light: inset -4px -4px 8px rgba(255, 255, 255, 0.04);

  --shadow-button-hover-dark: 4px 4px 8px rgba(0, 0, 0, 0.55);
  --shadow-button-hover-light: -4px -4px 8px rgba(255, 255, 255, 0.04);
}
```

### 2. SCSS Mixins

```scss
// Neumorphic Mixins (mixins.scss)

// Extruded Element (Popping Out)
@mixin nm-flat {
  background: var(--base-bg);
  box-shadow: var(--shadow-flat-dark), var(--shadow-flat-light);
  border: none;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// Depressed Element (Sunken/Carved In)
@mixin nm-inset {
  background: var(--base-bg);
  box-shadow: var(--shadow-inset-dark), var(--shadow-inset-light);
  border: none;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s ease;
}

// Dynamic Button (Extruded, flattens on hover, depresses when pressed)
@mixin nm-button {
  background: var(--base-bg);
  box-shadow: var(--shadow-flat-dark), var(--shadow-flat-light);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease-in-out;

  &:hover {
    box-shadow: var(--shadow-button-hover-dark), var(--shadow-button-hover-light);
    transform: translateY(1px);
  }

  &:active, &.active {
    box-shadow: var(--shadow-inset-dark), var(--shadow-inset-light);
    transform: translateY(2px);
  }
}
```

---

## 🔒 1. Login Page Layout

A minimalist, centered neumorphic card with text fields carved into the background and a popping action button.

### Login HTML Template

```html
<div class="login-container">
  <div class="login-card">
    <div class="login-header">
      <div class="logo-circle">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logo-icon"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
      </div>
      <h2>Listen With Friends</h2>
      <p>Connect and share synchronized music rooms</p>
    </div>
    
    <form class="login-form">
      <div class="form-group">
        <label for="username">Username or Email</label>
        <div class="input-wrapper">
          <input type="text" id="username" class="nm-input" placeholder="e.g. musiclover" required />
        </div>
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <div class="input-wrapper">
          <input type="password" id="password" class="nm-input" placeholder="••••••••" required />
        </div>
      </div>
      
      <button type="submit" class="nm-btn-primary">Sign In</button>
    </form>
    
    <div class="login-footer">
      <p>New to the platform? <a href="#">Create an Account</a></p>
    </div>
  </div>
</div>
```

### Login SCSS Stylesheet

```scss
@import 'variables';
@import 'mixins';

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-h: 100vh;
  background-color: var(--base-bg);
  font-family: var(--font-sans);
  color: var(--text-main);
  transition: background-color 0.3s;
}

.login-card {
  @include nm-flat;
  width: 100%;
  max-width: 420px;
  padding: 40px;
  box-sizing: border-box;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;

  .logo-circle {
    @include nm-flat;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 15px;
    color: var(--accent-cyan);
  }

  .logo-icon {
    width: 28px;
    height: 28px;
  }

  h2 {
    font-size: 24px;
    font-weight: 800;
    margin: 5px 0;
  }

  p {
    font-size: 13px;
    color: var(--text-muted);
    margin: 5px 0 0 0;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-muted);
    }
  }

  .nm-input {
    @include nm-inset;
    width: 100%;
    padding: 14px 18px;
    font-size: 14px;
    color: var(--text-main);
    box-sizing: border-box;

    &::placeholder {
      color: var(--text-muted);
      opacity: 0.6;
    }

    &:focus {
      box-shadow: var(--shadow-inset-dark), 
                  var(--shadow-inset-light), 
                  0 0 8px var(--accent-cyan-glow);
    }
  }

  .nm-btn-primary {
    @include nm-button;
    width: 100%;
    padding: 14px;
    font-size: 14px;
    color: var(--text-main);
    margin-top: 10px;
    background: linear-gradient(135deg, var(--base-bg), var(--base-bg));

    &:hover {
      color: var(--accent-cyan);
    }
  }
}

.login-footer {
  text-align: center;
  margin-top: 25px;
  font-size: 12px;
  color: var(--text-muted);

  a {
    color: var(--accent-pink);
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
}
```

---

## 🖥️ 2. Admin Dashboard Layout

A complete layout containing sidebar navigation (using depressed status for selected pages), top header details, and content cards (with stats metrics grids and structured table cells).

### Dashboard HTML Template

```html
<div class="dashboard-wrapper">
  <!-- Sidebar Navigation -->
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="logo-mini"></div>
      <h3>LWF Admin</h3>
    </div>
    
    <nav class="sidebar-nav">
      <a href="#" class="nav-item active">
        <svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>
        <span>Overview</span>
      </a>
      <a href="#" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        <span>Active Rooms</span>
      </a>
      <a href="#" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        <span>Manage Users</span>
      </a>
      <a href="#" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        <span>Settings</span>
      </a>
    </nav>
  </aside>

  <!-- Main Content Area -->
  <main className="main-content">
    
    <!-- Top Header -->
    <header class="top-header">
      <div class="search-bar-wrapper">
        <input type="text" class="search-bar" placeholder="Search rooms, users, logs..." />
      </div>
      
      <div class="header-actions">
        <!-- Theme Toggle Button -->
        <button id="theme-toggle" class="header-btn" onclick="toggleTheme()">
          <svg class="btn-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line></svg>
        </button>
        
        <div class="profile-badge">
          <div class="avatar-mini">A</div>
          <span>Admin</span>
        </div>
      </div>
    </header>
    
    <!-- Dashboard Content -->
    <div class="content-body">
      <h2>Overview Dashboard</h2>
      
      <!-- Metrics Grid -->
      <section class="metrics-grid">
        <div class="stat-card">
          <div class="stat-icon icon-cyan">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="w-6 h-6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
          </div>
          <div class="stat-info">
            <h4>Total Users</h4>
            <span class="stat-val">1,248</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon icon-pink">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="w-6 h-6"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
          </div>
          <div class="stat-info">
            <h4>Active Rooms</h4>
            <span class="stat-val">48</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-purple">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="w-6 h-6"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div class="stat-info">
            <h4>Premium Accounts</h4>
            <span class="stat-val">312</span>
          </div>
        </div>
      </section>

      <!-- Table Section -->
      <section class="table-section-card">
        <h3>Recent Rooms Activity</h3>
        
        <div class="table-responsive">
          <table class="nm-table">
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Host</th>
                <th>Users Connected</th>
                <th>Current Playing</th>
                <th>Security</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Lofi Beats Chill</td>
                <td>filjo_123</td>
                <td>12 / 20</td>
                <td>Blinding Lights</td>
                <td><span class="badge badge-public">Public</span></td>
              </tr>
              <tr>
                <td>Late Night Rock</td>
                <td>sarah_k</td>
                <td>8 / 10</td>
                <td>Bohemian Rhapsody</td>
                <td><span class="badge badge-private">Private</span></td>
              </tr>
              <tr>
                <td>Pop Hits Remix</td>
                <td>alex_j</td>
                <td>4 / 15</td>
                <td>Shape of You</td>
                <td><span class="badge badge-public">Public</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  </main>
</div>
```

### Dashboard SCSS Stylesheet

```scss
@import 'variables';
@import 'mixins';

.dashboard-wrapper {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-h: 100vh;
  background-color: var(--base-bg);
  color: var(--text-main);
  font-family: var(--font-sans);
  transition: background-color 0.3s;
}

// Sidebar Navigation Styles
.sidebar {
  @include nm-flat;
  margin: 15px;
  padding: 25px 15px;
  display: flex;
  flex-direction: column;
  gap: 35px;
  height: calc(100vh - 30px);
  box-sizing: border-box;

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-left: 10px;

    .logo-mini {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-cyan), var(--accent-pink));
      box-shadow: 0 4px 8px rgba(0, 188, 212, 0.3);
    }

    h3 {
      font-size: 16px;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.5px;
    }
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 15px;

    .nav-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 14px 20px;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      border-radius: 12px;
      transition: all 0.2s;

      .nav-icon {
        width: 18px;
        height: 18px;
      }

      &:hover {
        color: var(--text-main);
        background: rgba(255, 255, 255, 0.02);
      }

      &.active {
        @include nm-inset;
        color: var(--accent-cyan);
      }
    }
  }
}

// Main Content & Top Header
.main-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  padding: 15px 15px 15px 0;
}

.top-header {
  @include nm-flat;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  margin-bottom: 25px;
  box-sizing: border-box;

  .search-bar {
    @include nm-inset;
    padding: 10px 18px;
    width: 280px;
    font-size: 13px;
    color: var(--text-main);

    &::placeholder {
      color: var(--text-muted);
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 20px;

    .header-btn {
      @include nm-button;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      color: var(--text-muted);

      .btn-icon {
        width: 18px;
        height: 18px;
      }

      &:hover {
        color: var(--accent-pink);
      }
    }

    .profile-badge {
      @include nm-flat;
      padding: 6px 14px 6px 6px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 30px;

      .avatar-mini {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: var(--accent-cyan);
        color: var(--base-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
      }
    }
  }
}

// Content Body Panels
.content-body {
  padding: 0 15px;

  h2 {
    font-size: 26px;
    font-weight: 800;
    margin-bottom: 25px;
  }
}

// Metrics Cards Grid
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 25px;
  margin-bottom: 35px;

  .stat-card {
    @include nm-flat;
    padding: 25px;
    display: flex;
    align-items: center;
    gap: 20px;

    .stat-icon {
      @include nm-inset;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        width: 22px;
        height: 22px;
      }

      &.icon-cyan { color: var(--accent-cyan); }
      &.icon-pink { color: var(--accent-pink); }
      &.icon-purple { color: #a855f7; }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      h4 {
        margin: 0;
        font-size: 12px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat-val {
        font-size: 24px;
        font-weight: 800;
        margin-top: 5px;
      }
    }
  }
}

// Neumorphic Tables
.table-section-card {
  @include nm-flat;
  padding: 30px;
  margin-bottom: 20px;

  h3 {
    font-size: 16px;
    font-weight: 800;
    margin-top: 0;
    margin-bottom: 20px;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .nm-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13px;

    thead th {
      color: var(--text-muted);
      font-weight: 700;
      padding: 12px 15px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }

    tbody tr {
      transition: all 0.2s;

      &:hover {
        background: rgba(0, 0, 0, 0.01);
      }

      td {
        padding: 16px 15px;
        color: var(--text-main);
        font-weight: 500;
        border-bottom: 1px solid rgba(0, 0, 0, 0.02);

        .badge {
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          text-transform: uppercase;

          &.badge-public {
            background-color: rgba(0, 188, 212, 0.12);
            color: var(--accent-cyan);
          }

          &.badge-private {
            background-color: rgba(233, 30, 99, 0.12);
            color: var(--accent-pink);
          }
        }
      }
    }
  }
}
