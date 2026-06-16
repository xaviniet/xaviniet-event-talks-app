# BigQuery Release Notes Web App 🚀

A lightweight, modern Flask web application that aggregates, displays, and shares Google Cloud's BigQuery Release Notes.

## Features

- **Live Aggregation**: Parses Google's official XML Atom release notes feed automatically.
- **Dynamic Asynchronous Updates**: A single click fetches updates with a smooth CSS-based loader, avoiding full page refreshes.
- **Twitter Integration**:
  - **Quick Intent**: Directly open Twitter's compose box pre-filled with the update content.
  - **Auto-Post Mode**: Connect your Twitter credentials to post updates directly to your timeline from the UI.
- **Modern UI**: Dark-mode glassmorphic styling, responsive layout, and customized typography.

---

## Tech Stack

- **Backend**: Python Flask 3
- **Frontend**: Vanilla HTML5, Vanilla JS (ES6+), Vanilla CSS3
- **Dependency Management**: `uv` package manager (or traditional pip virtual environments)

---

## Getting Started

Make sure you have [uv](https://github.com/astral-sh/uv) installed.

### Option A: The Fast Way (Direct Script Run) ⚡

Because `app.py` has embedded PEP 723 metadata, `uv` will download, cache, and configure the Python dependencies in a temporary environment for you automatically:

```bash
uv run app.py
```

Open your browser to [http://localhost:50001](http://localhost:50001).

### Option B: Local Virtual Environment Setup 🛠️

1. **Create the environment**:
   ```bash
   uv venv
   ```
2. **Activate the environment**:
   ```bash
   source .venv/bin/activate
   ```
3. **Install dependencies**:
   ```bash
   uv pip install -r requirements.txt
   ```
4. **Start the server**:
   ```bash
   python app.py
   ```

---

## Configuration & Environment Variables

If you wish to post tweets directly through the app without redirecting to a browser tab, configure the following environment variables:

```bash
export TWITTER_API_KEY="your_api_key"
export TWITTER_API_SECRET="your_api_secret"
export TWITTER_ACCESS_TOKEN="your_access_token"
export TWITTER_ACCESS_SECRET="your_access_secret"
```

If not provided, the app will gracefully fall back to Twitter's web intent editor.

---

## Project Structure

```
├── app.py           # Flask backend & Feed-parsing logic
├── requirements.txt # Dependency listings
├── templates/
│   └── index.html   # Main layout structure
└── static/
    ├── css/
    │   └── style.css # Custom dark theme & transitions
    └── js/
        └── main.js   # Dynamic updates & tweet handler
```
