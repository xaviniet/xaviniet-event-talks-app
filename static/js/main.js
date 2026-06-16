// static/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refreshBtn');
  const spinner = document.getElementById('spinner');
  const notesList = document.getElementById('notesList');

  const showSpinner = (show) => {
    spinner.style.visibility = show ? 'visible' : 'hidden';
  };

  const renderNotes = (notes) => {
    notesList.innerHTML = '';
    notes.forEach(note => {
      const li = document.createElement('li');
      li.className = 'note';
      li.dataset.title = note.title;
      li.dataset.content = note.content;

      const title = document.createElement('strong');
      title.textContent = note.title;
      const updated = document.createElement('em');
      updated.textContent = ;
      const contentP = document.createElement('p');
      contentP.className = 'content';
      contentP.innerHTML = note.content;
      const tweetBtn = document.createElement('button');
      tweetBtn.className = 'tweetBtn';
      tweetBtn.textContent = 'Tweet';

      tweetBtn.addEventListener('click', () => handleTweet(note));

      li.appendChild(title);
      li.appendChild(updated);
      li.appendChild(contentP);
      li.appendChild(tweetBtn);
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

  const handleTweet = async (note) => {
    const tweetText = .trim();
    try {
      const res = await fetch('/tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: tweetText })
      });
      const result = await res.json();
      if (res.ok) {
        alert('Tweet posted! ID: ' + result.tweet_id);
      } else {
        alert('Tweet failed: ' + (result.error || 'unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Error sending tweet request');
    }
  };

  // Initial fetch (in case Jinja rendered empty list)
  if (notesList.children.length === 0) {
    fetchNotes();
  }

  refreshBtn.addEventListener('click', fetchNotes);
});
