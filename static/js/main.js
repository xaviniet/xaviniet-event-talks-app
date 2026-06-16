// static/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refreshBtn');
  const exportBtn = document.getElementById('exportBtn');
  const spinner = document.getElementById('spinner');
  const notesList = document.getElementById('notesList');

  const showSpinner = (show) => {
    spinner.style.visibility = show ? 'visible' : 'hidden';
  };

  // Strip HTML helper
  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const handleCopy = (note, btn) => {
    const cleanContent = stripHtml(note.content);
    const copyText = `${note.title}\n\n${cleanContent}`.trim();
    navigator.clipboard.writeText(copyText).then(() => {
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      btn.style.background = '#28a745';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Could not copy to clipboard.');
    });
  };

  const handleTweet = async (note) => {
    const cleanContent = stripHtml(note.content);
    const tweetText = `${note.title}\n\n${cleanContent}`.trim();
    try {
      const res = await fetch('/tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: tweetText })
      });
      if (res.redirected) {
        // Fallback redirect to Twitter Web Intent
        window.open(res.url, '_blank');
      } else {
        const result = await res.json();
        if (res.ok) {
          alert('Tweet posted! ID: ' + result.tweet_id);
        } else {
          alert('Tweet failed: ' + (result.error || 'unknown error'));
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error sending tweet request');
    }
  };

  const renderNotes = (notes) => {
    notesList.innerHTML = '';
    notes.forEach(note => {
      const li = document.createElement('li');
      li.className = 'note';
      li.dataset.title = note.title;
      li.dataset.content = note.content;
      li.dataset.updated = note.updated;

      const title = document.createElement('strong');
      title.textContent = note.title;
      const updated = document.createElement('em');
      updated.textContent = ` ${note.updated}`;
      const contentP = document.createElement('p');
      contentP.className = 'content';
      contentP.innerHTML = note.content;

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'actions';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copyBtn';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', () => handleCopy(note, copyBtn));

      const tweetBtn = document.createElement('button');
      tweetBtn.className = 'tweetBtn';
      tweetBtn.textContent = 'Tweet';
      tweetBtn.addEventListener('click', () => handleTweet(note));

      actionsDiv.append(copyBtn, tweetBtn);
      li.append(title, updated, contentP, actionsDiv);
      notesList.appendChild(li);
    });
  };

  const fetchNotes = async () => {
    showSpinner(true);
    try {
      const res = await fetch('/refresh');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      renderNotes(data);
    } catch (e) {
      console.error(e);
      alert('Failed to fetch release notes');
    } finally {
      showSpinner(false);
    }
  };

  const exportToCSV = () => {
    const notes = Array.from(notesList.querySelectorAll('.note')).map(li => ({
      title: li.dataset.title || "",
      updated: li.dataset.updated || "",
      content: stripHtml(li.dataset.content || "")
    }));

    if (notes.length === 0) {
      alert("No notes to export.");
      return;
    }

    const headers = ["Title", "Updated Date", "Description"];
    const escapeCSV = (str) => `"${str.replace(/"/g, '""')}"`;

    const csvRows = [
      headers.join(','),
      ...notes.map(note => [
        escapeCSV(note.title),
        escapeCSV(note.updated),
        escapeCSV(note.content)
      ].join(','))
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bigquery_release_notes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bind events to initial elements loaded via server-side template
  const bindInitialEvents = () => {
    notesList.querySelectorAll('.note').forEach(li => {
      const note = {
        title: li.dataset.title,
        content: li.dataset.content,
        updated: li.dataset.updated
      };
      const copyBtn = li.querySelector('.copyBtn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => handleCopy(note, copyBtn));
      }
      const tweetBtn = li.querySelector('.tweetBtn');
      if (tweetBtn) {
        tweetBtn.addEventListener('click', () => handleTweet(note));
      }
    });
  };

  // Check if we need to pull notes initially or bind current ones
  if (notesList.children.length === 0) {
    fetchNotes();
  } else {
    bindInitialEvents();
  }

  refreshBtn.addEventListener('click', fetchNotes);
  exportBtn.addEventListener('click', exportToCSV);

  // Theme Toggle Switch logic
  const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
  const switchTheme = (e) => {
    if (e.target.checked) {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  };

  if (toggleSwitch) {
    toggleSwitch.addEventListener('change', switchTheme, false);

    // Initial check of local storage to set preference
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'light') {
      toggleSwitch.checked = true;
      document.documentElement.classList.add('light-mode');
    }
  }
});

