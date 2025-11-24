const form = document.getElementById('search-form');
const input = document.getElementById('word');
const results = document.getElementById('results');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const word = input.value.trim();
    if (!word) return;

    setBusy(true);
    clearResults();
    renderInfo(`Looking up “${word}”...`);

    try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        const data = await res.json();

        clearResults();

        if (!Array.isArray(data)) {
            renderError(data.title || 'No results', data.message || 'Please try a different word.');
            return;
        }

        data.forEach(renderEntry);
    } catch (err) {
        clearResults();
        renderError('Network error', 'Please check your connection and try again.');
    } finally {
        setBusy(false);
    }
});

function setBusy(isBusy) {
    results.setAttribute('aria-busy', String(isBusy));
}

function clearResults() {
    results.innerHTML = '';
}

function renderInfo(text) {
    const div = document.createElement('div');
    div.className = 'card';
    div.textContent = text;
    results.appendChild(div);
}

function renderError(title, message) {
    const card = document.createElement('div');
    card.className = 'card error';
    const h3 = document.createElement('h3');
    h3.textContent = title;
    const p = document.createElement('p');
    p.textContent = message;
    card.append(h3, p);
    results.appendChild(card);
}

function renderEntry(entry) {
    const card = document.createElement('article');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'word-header';

    const wordEl = document.createElement('h2');
    wordEl.className = 'word-title';
    wordEl.textContent = entry.word || '';

    const phoneticText =
        entry.phonetic ||
        (Array.isArray(entry.phonetics) &&
            (entry.phonetics.find(p => p.text)?.text || ''));

    if (phoneticText) {
        const phon = document.createElement('span');
        phon.className = 'phonetic';
        phon.textContent = phoneticText;
        header.append(wordEl, phon);
    } else {
        header.append(wordEl);
    }

    card.appendChild(header);

    if (Array.isArray(entry.meanings) && entry.meanings.length) {
        entry.meanings.forEach(m => {
            if (!m || !m.partOfSpeech || !Array.isArray(m.definitions)) return;

            const pos = document.createElement('div');
            pos.className = 'part-of-speech';
            pos.textContent = m.partOfSpeech;

            const ul = document.createElement('ol');
            ul.className = 'definition-list';

            m.definitions.forEach((def, i) => {
                const li = document.createElement('li');
                const defText = document.createElement('span');
                defText.textContent = def.definition || '';
                li.appendChild(defText);

                if (def.example) {
                    const ex = document.createElement('span');
                    ex.className = 'example';
                    ex.textContent = ` — “${def.example}”`;
                    li.appendChild(ex);
                }

                if (Array.isArray(def.synonyms) && def.synonyms.length) {
                    const syn = document.createElement('div');
                    syn.className = 'example';
                    syn.textContent = `Synonyms: ${def.synonyms.slice(0, 6).join(', ')}`;
                    li.appendChild(syn);
                }

                ul.appendChild(li);
            });

            card.append(pos, ul);
        });
    } else {
        const p = document.createElement('p');
        p.textContent = 'No definitions found.';
        card.appendChild(p);
    }

    results.appendChild(card);
}

(function restoreLast() {
    const last = localStorage.getItem('lastWord');
    if (last) {
        input.value = last;
    }
})();
input.addEventListener('change', () => {
    localStorage.setItem('lastWord', input.value.trim());
});
