# /// script
# dependencies = [
#   "flask>=3.0.0",
#   "requests>=2.31.0",
#   "tweepy>=4.14.0",
# ]
# ///

from flask import Flask, render_template, jsonify, request
import os
import requests
import xml.etree.ElementTree as ET

app = Flask(__name__)

FEED_URL = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'

def fetch_notes():
    resp = requests.get(FEED_URL)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
    # Each entry is under <entry>
    notes = []
    for entry in root.findall('{http://www.w3.org/2005/Atom}entry'):
        title = entry.find('{http://www.w3.org/2005/Atom}title').text
        updated = entry.find('{http://www.w3.org/2005/Atom}updated').text
        content_elem = entry.find('{http://www.w3.org/2005/Atom}content')
        content = content_elem.text if content_elem is not None else ''
        notes.append({'title': title, 'updated': updated, 'content': content})
    return notes

@app.route('/')
def index():
    notes = fetch_notes()
    return render_template('index.html', notes=notes)

@app.route('/api/notes')
def api_notes():
    notes = fetch_notes()
    return jsonify(notes)

# Endpoint used by the client side to refresh notes without full page reload
@app.route('/refresh')
def refresh():
    notes = fetch_notes()
    return jsonify(notes)

# Simple tweet endpoint. If Twitter credentials are set in env, it will post directly.
# Otherwise it redirects to Twitter's intent URL for manual tweeting.
@app.route('/tweet', methods=['POST'])
def tweet():
    data = request.get_json(silent=True) or {}
    text = data.get('text', '')
    if not text:
        return jsonify({'error': 'No tweet text provided'}), 400
    # Check for env credentials
    api_key = os.getenv('TWITTER_API_KEY')
    api_secret = os.getenv('TWITTER_API_SECRET')
    access_token = os.getenv('TWITTER_ACCESS_TOKEN')
    access_secret = os.getenv('TWITTER_ACCESS_SECRET')
    if all([api_key, api_secret, access_token, access_secret]):
        try:
            import tweepy
            auth = tweepy.OAuth1UserHandler(api_key, api_secret, access_token, access_secret)
            api = tweepy.API(auth)
            tweet = api.update_status(status=text)
            return jsonify({'tweet_id': tweet.id, 'text': tweet.text})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        # Fallback to Twitter's web intent
        intent_url = f"https://twitter.com/intent/tweet?text={requests.utils.quote(text)}"
        return redirect(intent_url)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 50001))
    app.run(debug=True, host='0.0.0.0', port=port)
