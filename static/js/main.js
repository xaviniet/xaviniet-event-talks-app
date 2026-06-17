// static/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refreshBtn');
  const exportBtn = document.getElementById('exportBtn');
  const spinner = document.getElementById('spinner');
  const notesList = document.getElementById('notesList');
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const toastContainer = document.getElementById('toastContainer');
  const retryBtn = document.getElementById('retryBtn');

  const showSpinner = (show) => {
    spinner.style.visibility = show ? 'visible' : 'hidden';
  };

  // Toast notification system
  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    // Automatically clean up DOM after animation completes (3s)
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  // Strip HTML helper
  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  // Human-readable date formatting
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Copy handler with feedback
  const handleCopy = (note, btn) => {
    const cleanContent = stripHtml(note.content);
    const copyText = `${note.title}\n\n${cleanContent}`.trim();
    navigator.clipboard.writeText(copyText).then(() => {
      showToast('Copied to clipboard!', 'success');
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      btn.style.background = '#28a745';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      showToast('Failed to copy to clipboard', 'error');
    });
  };

  // Tweet handler with loaders
  const handleTweet = async (note, btn) => {
    const cleanContent = stripHtml(note.content);
    const tweetText = `${note.title}\n\n${cleanContent}`.trim();
    
    const originalText = btn.textContent;
    btn.textContent = 'Tweeting...';
    btn.disabled = true;

    try {
      const res = await fetch('/tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: tweetText })
      });
      if (res.redirected) {
        window.open(res.url, '_blank');
        showToast('Opening Twitter composer...', 'info');
      } else {
        const result = await res.json();
        if (res.ok) {
          showToast('Tweet posted successfully!', 'success');
        } else {
          showToast('Tweet failed: ' + (result.error || 'unknown error'), 'error');
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Error sending tweet request', 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  };

  // Set up collapsible logic for a card
  const setupCollapsibleNote = (li) => {
    const wrapper = li.querySelector('.content-wrapper');
    const content = li.querySelector('.content');
    const readMoreBtn = li.querySelector('.read-more-btn');
    
    if (!wrapper || !content || !readMoreBtn) return;
    
    const thresholdHeight = 110;
    
    // Check height and toggle control display
    if (content.scrollHeight > thresholdHeight) {
      readMoreBtn.style.display = 'inline-block';
      wrapper.classList.add('collapsed');
      readMoreBtn.textContent = 'Read More';
    } else {
      readMoreBtn.style.display = 'none';
      wrapper.classList.remove('collapsed');
    }
    
    // Clear and clone to avoid duplicate listeners on updates
    const newBtn = readMoreBtn.cloneNode(true);
    readMoreBtn.parentNode.replaceChild(newBtn, readMoreBtn);
    
    newBtn.addEventListener('click', () => {
      if (wrapper.classList.contains('collapsed')) {
        wrapper.classList.remove('collapsed');
        newBtn.textContent = 'Read Less';
      } else {
        wrapper.classList.add('collapsed');
        newBtn.textContent = 'Read More';
        li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  };

  // Live filter query matching
  const filterNotes = () => {
    const query = searchInput.value.toLowerCase().trim();
    const filterType = typeFilter.value;
    const notes = notesList.querySelectorAll('.note');
    
    notes.forEach(note => {
      const title = (note.dataset.title || "").toLowerCase();
      const contentText = stripHtml(note.dataset.content || "").toLowerCase();
      
      const matchesSearch = title.includes(query) || contentText.includes(query);
      
      let matchesType = false;
      if (filterType === 'all') {
        matchesType = true;
      } else if (filterType === 'ga') {
        matchesType = title.includes('generally available') || contentText.includes('generally available') || title.includes(' ga ') || title.includes('(ga)');
      } else if (filterType === 'preview') {
        matchesType = title.includes('preview') || contentText.includes('preview');
      } else if (filterType === 'deprecated') {
        matchesType = title.includes('deprecated') || contentText.includes('deprecated') || title.includes('deprecation') || contentText.includes('deprecation');
      }
      
      if (matchesSearch && matchesType) {
        note.style.display = 'block';
      } else {
        note.style.display = 'none';
      }
    });
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
      updated.textContent = ` ${formatDate(note.updated)}`;
      
      const wrapperDiv = document.createElement('div');
      wrapperDiv.className = 'content-wrapper collapsed';
      const contentDiv = document.createElement('div');
      contentDiv.className = 'content';
      contentDiv.innerHTML = note.content;
      wrapperDiv.appendChild(contentDiv);

      const readMoreBtn = document.createElement('button');
      readMoreBtn.className = 'read-more-btn';
      readMoreBtn.textContent = 'Read More';
      readMoreBtn.style.display = 'none';

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'actions';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copyBtn';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', () => handleCopy(note, copyBtn));

      const tweetBtn = document.createElement('button');
      tweetBtn.className = 'tweetBtn';
      tweetBtn.textContent = 'Tweet';
      tweetBtn.addEventListener('click', () => handleTweet(note, tweetBtn));

      actionsDiv.append(copyBtn, tweetBtn);
      li.append(title, updated, wrapperDiv, readMoreBtn, actionsDiv);
      notesList.appendChild(li);

      // Setup heights/toggles
      setupCollapsibleNote(li);
    });

    // Reapply filter state after fetching new ones
    filterNotes();
  };

  const fetchNotes = async () => {
    showSpinner(true);
    try {
      const res = await fetch('/refresh');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      renderNotes(data);
      
      // Hide error state card if active
      const errorCard = document.getElementById('errorCard');
      if (errorCard) errorCard.style.display = 'none';
      
      showToast('Release notes updated successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to refresh release notes', 'error');
    } finally {
      showSpinner(false);
    }
  };

  const exportToCSV = () => {
    const visibleNotes = Array.from(notesList.querySelectorAll('.note'))
      .filter(li => li.style.display !== 'none')
      .map(li => ({
        title: li.dataset.title || "",
        updated: li.dataset.updated || "",
        content: stripHtml(li.dataset.content || "")
      }));

    if (visibleNotes.length === 0) {
      showToast("No visible notes to export.", "info");
      return;
    }

    const headers = ["Title", "Updated Date", "Description"];
    const escapeCSV = (str) => `"${str.replace(/"/g, '""')}"`;

    const csvRows = [
      headers.join(','),
      ...visibleNotes.map(note => [
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
    showToast('Exported visible items to CSV!', 'success');
  };

  // Bind initial HTML server-rendered events
  const bindInitialEvents = () => {
    notesList.querySelectorAll('.note').forEach(li => {
      const note = {
        title: li.dataset.title,
        content: li.dataset.content,
        updated: li.dataset.updated
      };
      
      // Re-format server date in-place
      const em = li.querySelector('em');
      if (em) {
        em.textContent = ` ${formatDate(note.updated)}`;
      }

      const copyBtn = li.querySelector('.copyBtn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => handleCopy(note, copyBtn));
      }
      const tweetBtn = li.querySelector('.tweetBtn');
      if (tweetBtn) {
        tweetBtn.addEventListener('click', () => handleTweet(note, tweetBtn));
      }

      setupCollapsibleNote(li);
    });
  };

  // Wire search input listeners
  searchInput.addEventListener('input', filterNotes);
  typeFilter.addEventListener('change', filterNotes);

  // Wire retry button if present
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      fetchNotes();
    });
  }

  // Check initial list status and bind
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

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'light') {
      toggleSwitch.checked = true;
      document.documentElement.classList.add('light-mode');
    }
  }
});

