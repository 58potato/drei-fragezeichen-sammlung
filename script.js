let bookStates = {};
let scrollPosition = 0;
let collapsedSeries = {};
let darkMode = false;

function getCoverUrl(book) {
    const baseUrl = 'images/';

    const idMatch = book.id.match(/\d+/);
    if (!idMatch) {
        return baseUrl + 'klassiker/b1.jpg';
    }

    const num = parseInt(idMatch[0]);
    let seriesFolder = '';
    let coverCode = '';

    switch(book.series) {
        case 'klassiker':
            seriesFolder = 'klassiker';
            coverCode = `b${num}`;
            break;

        case 'neuzeit':
            seriesFolder = 'neuzeit';
            coverCode = `b${num}`;
            break;

        case 'sammelband':
            seriesFolder = 'sammelband';
            coverCode = `b${599 + num}`;
            break;

        case 'sonderausgaben':
            seriesFolder = 'sonderausgaben';
            coverCode = `b${num}`;
            break;

        case 'sonderband':
            seriesFolder = 'sonderband';
            coverCode = `b${499 + num}`;
            break;

        case 'kids':
            seriesFolder = 'kids';
            coverCode = `k${num}`;
            break;

        case 'kids_mini':
            seriesFolder = 'kids_mini';
            coverCode = `k${1600 + num}`;
            break;

        case 'kids_rate':
            seriesFolder = 'kids_rate';
            coverCode = `kr${num}`;
            break;

        case 'kids_sammel':
            seriesFolder = 'kids_sammel';
            coverCode = `k${1400 + num}`;
            break;

        case 'kids_sonder':
            seriesFolder = 'kids_sonder';
            coverCode = `k${1500 + num}`;
            break;

        case 'kids_und_du':
            seriesFolder = 'kids_und_du';
            coverCode = `k${1200 + num}`;
            break;

        default:
            seriesFolder = 'klassiker';
            coverCode = 'b1';
    }

    return `${baseUrl}${seriesFolder}/${coverCode}.jpg`;
}

function initStates() {
    const savedBooks = localStorage.getItem('bookStates');
    const savedCollapsed = localStorage.getItem('collapsedSeries');
    const savedDarkMode = localStorage.getItem('darkMode');

    if (savedBooks) bookStates = JSON.parse(savedBooks);
    if (savedCollapsed) collapsedSeries = JSON.parse(savedCollapsed);
    if (savedDarkMode !== null) {
        darkMode = JSON.parse(savedDarkMode);
    } else {
        darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    books.forEach(book => {
        if (bookStates[book.id] === undefined) bookStates[book.id] = 0;
    });

    localStorage.setItem('bookStates', JSON.stringify(bookStates));

    applyDarkMode();
}

function applyDarkMode() {
    if (darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.setAttribute('data-theme', darkMode ? 'dark' : 'light');

        const lightOption = themeToggle.querySelector('[data-theme="light"]');
        const darkOption = themeToggle.querySelector('[data-theme="dark"]');

        if (lightOption && darkOption) {
            if (darkMode) {
                lightOption.classList.remove('active');
                darkOption.classList.add('active');
            } else {
                lightOption.classList.add('active');
                darkOption.classList.remove('active');
            }
        }
    }

    const logo = document.querySelector('.logo');
    if (logo) {
        logo.src = darkMode ? 'images/logo-dark.png' : 'images/logo.png';
    }

    const scrollArrow = document.querySelector('#scrollToTopBtn img');
    if (scrollArrow) {
        scrollArrow.src = darkMode ? 'images/arrow_up_dark.png' : 'images/arrow_up.png';
    }
}

function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    applyDarkMode();
}

initStates();

const savedScrollPos = sessionStorage.getItem('scrollPosition');
if (savedScrollPos) scrollPosition = parseInt(savedScrollPos);

function getCounts(seriesId = null) {
    const items = seriesId ? books.filter(b => b.series === seriesId) : books;
    const haben = items.filter(b => bookStates[b.id] === 1).length;
    const tauschen = items.filter(b => bookStates[b.id] === 2).length;
    const multiple = items.filter(b => bookStates[b.id] === 3).length;
    return { haben, tauschen, multiple, total: items.length };
}

function getSeriesCompletion(seriesId) {
    const items = books.filter(b => b.series === seriesId);
    const allCollected = items.every(b => bookStates[b.id] > 0);
    const allTauschen = items.every(b => bookStates[b.id] === 2);
    const allMultiple = items.every(b => bookStates[b.id] === 3);
    return { allCollected, allTauschen, allMultiple };
}

function updateCounters() {
    series.forEach(seriesData => {
        const counterEl = document.getElementById(`counter-${seriesData.id}`);
        if (counterEl) {
            const { haben, tauschen, multiple, total } = getCounts(seriesData.id);
            const { allCollected, allTauschen, allMultiple } = getSeriesCompletion(seriesData.id);

            if (allCollected) {
                let starColor = allTauschen ? 'gold' : (allMultiple ? 'blue' : 'green');
                counterEl.innerHTML = `<span class="completion-count ${starColor}">${haben + tauschen + multiple} <span class="completion-star ${starColor}">★</span></span>`;
            } else {
                counterEl.innerHTML = `
                    <span class="haben-count">${haben}</span> + 
                    <span class="tauschen-count">${tauschen}</span> + 
                    <span class="multiple-count" style="color:#2196F3; font-weight:bold;">${multiple}</span> = 
                    <span class="owned-count">${haben + tauschen + multiple}</span> / <strong>${total}</strong>
                `;
            }
        }
    });

    const overallCounter = document.getElementById('counter-overall');
    if (overallCounter) {
        const { haben, tauschen, multiple, total } = getCounts();
        overallCounter.innerHTML = `
            <span class="haben-count">${haben}</span> + 
            <span class="tauschen-count">${tauschen}</span> + 
            <span class="multiple-count" style="color:#2196F3; font-weight:bold;">${multiple}</span> = 
            <span class="owned-count">${haben + tauschen + multiple}</span> / <strong>${total}</strong>
        `;
    }
}

function cycleState(bookId) {
    bookStates[bookId] = (bookStates[bookId] + 1) % 4;

    const card = document.querySelector(`[data-book-id="${bookId}"]`);
    if (card) card.className = `book-card state-${bookStates[bookId]}`;

    updateCounters();
    localStorage.setItem('bookStates', JSON.stringify(bookStates));
}

function markAllInSeries(seriesId, state) {
    const booksSeries = books.filter(b => b.series === seriesId);

    booksSeries.forEach(book => {
        bookStates[book.id] = state;
        const card = document.querySelector(`[data-book-id="${book.id}"]`);
        if (card) card.className = `book-card state-${state}`;
    });

    updateCounters();
    localStorage.setItem('bookStates', JSON.stringify(bookStates));
}

function toggleSeriesCollapse(seriesId) {
    collapsedSeries[seriesId] = !collapsedSeries[seriesId];
    localStorage.setItem('collapsedSeries', JSON.stringify(collapsedSeries));

    const cards = document.querySelectorAll(`[data-series-id="${seriesId}"]`);
    const arrow = document.querySelector(`[data-arrow-series="${seriesId}"]`);
    const header = arrow?.closest('.series-header-full');
    const buttonsContainer = header?.querySelector('.series-buttons');

    cards.forEach(card => card.style.display = collapsedSeries[seriesId] ? 'none' : 'block');
    if (arrow) arrow.classList.toggle('collapsed', collapsedSeries[seriesId]);
    if (header) header.classList.toggle('collapsed', collapsedSeries[seriesId]);
    if (buttonsContainer) buttonsContainer.style.display = collapsedSeries[seriesId] ? 'none' : 'flex';
}

function collapseAll() {
    series.forEach(seriesData => {
        collapsedSeries[seriesData.id] = true;

        const cards = document.querySelectorAll(`[data-series-id="${seriesData.id}"]`);
        const arrow = document.querySelector(`[data-arrow-series="${seriesData.id}"]`);
        const header = arrow?.closest('.series-header-full');
        const buttonsContainer = header?.querySelector('.series-buttons');

        cards.forEach(card => card.style.display = 'none');
        if (arrow) arrow.classList.add('collapsed');
        if (header) header.classList.add('collapsed');
        if (buttonsContainer) buttonsContainer.style.display = 'none';
    });

    localStorage.setItem('collapsedSeries', JSON.stringify(collapsedSeries));
}

function expandAll() {
    series.forEach(seriesData => {
        collapsedSeries[seriesData.id] = false;

        const cards = document.querySelectorAll(`[data-series-id="${seriesData.id}"]`);
        const arrow = document.querySelector(`[data-arrow-series="${seriesData.id}"]`);
        const header = arrow?.closest('.series-header-full');
        const buttonsContainer = header?.querySelector('.series-buttons');

        cards.forEach(card => card.style.display = 'block');
        if (arrow) arrow.classList.remove('collapsed');
        if (header) header.classList.remove('collapsed');
        if (buttonsContainer) buttonsContainer.style.display = 'flex';
    });

    localStorage.setItem('collapsedSeries', JSON.stringify(collapsedSeries));
}

function createBookCard(book) {
    const state = bookStates[book.id];

    const card = document.createElement('div');
    card.className = `book-card state-${state}`;
    card.setAttribute('data-book-id', book.id);
    card.setAttribute('data-series-id', book.series);

    const coverUrl = getCoverUrl(book);

    card.innerHTML = `
        <div class="image-container">
            <img src="${coverUrl}" 
                 alt="${book.name}">
            <div class="placeholder-image" style="display: none;">
                ${book.name}
            </div>
        </div>
        <div class="book-name">${book.name}</div>
    `;

    const img = card.querySelector('img');
    const placeholder = card.querySelector('.placeholder-image');
    img.addEventListener('error', () => {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
    });

    card.addEventListener('click', (e) => {
        e.preventDefault();
        cycleState(book.id);
    });

    return card;
}

function createSeriesHeader(seriesData) {
    const header = document.createElement('div');
    header.className = 'series-header-full';
    header.setAttribute('data-series-header', seriesData.id);

    const { haben, tauschen, total } = getCounts(seriesData.id);
    const { allCollected, allTauschen } = getSeriesCompletion(seriesData.id);

    const title = document.createElement('h2');
    const headerContent = document.createElement('div');
    headerContent.className = 'series-header-content';

    const collapseArrow = document.createElement('span');
    collapseArrow.className = 'collapse-arrow';
    collapseArrow.style.borderLeftColor = seriesData.color;
    collapseArrow.setAttribute('data-arrow-series', seriesData.id);

    const isCollapsed = collapsedSeries[seriesData.id];
    if (isCollapsed) {
        collapseArrow.classList.add('collapsed');
        header.classList.add('collapsed');
    }

    const titleText = document.createElement('span');
    titleText.className = 'series-title';
    titleText.textContent = seriesData.name;

    const counter = document.createElement('span');
    counter.className = 'series-counter';
    counter.id = `counter-${seriesData.id}`;

    if (allCollected) {
        const starColor = allTauschen ? 'gold' : 'green';
        counter.innerHTML = `<span class="completion-count ${starColor}">${haben + tauschen} <span class="completion-star ${starColor}">★</span></span>`;
    } else {
        counter.innerHTML = `<span class="haben-count">${haben}</span> + <span class="tauschen-count">${tauschen}</span> = <span class="owned-count">${haben + tauschen}</span> / <strong>${total}</strong>`;
    }

    headerContent.appendChild(collapseArrow);
    headerContent.appendChild(titleText);
    headerContent.appendChild(counter);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'series-buttons';
    if (isCollapsed) buttonsContainer.style.display = 'none';

    const buttons = [
        { class: 'btn-not-owned', text: 'Alle als "Hab ich nicht" markieren', state: 0 },
        { class: 'btn-haben', text: 'Alle als "Hab ich" markieren', state: 1 },
        { class: 'btn-tauschen', text: 'Alle als "Tauschen" markieren', state: 2 },
        { class: 'btn-multiple', text: 'Alle als "Duplikat" markieren', state: 3 }
    ];

    buttons.forEach(btnConfig => {
        const btn = document.createElement('button');
        btn.className = `series-btn ${btnConfig.class}`;
        btn.textContent = btnConfig.text;
        btn.onclick = (e) => {
            e.stopPropagation();
            markAllInSeries(seriesData.id, btnConfig.state);
        };
        buttonsContainer.appendChild(btn);
    });

    title.appendChild(headerContent);
    title.appendChild(buttonsContainer);
    title.style.cursor = 'pointer';
    title.addEventListener('click', (e) => {
        if (!e.target.closest('.series-buttons')) toggleSeriesCollapse(seriesData.id);
    });

    header.appendChild(title);
    return header;
}

function renderBooks() {
    const grid = document.getElementById('bookGrid');
    grid.innerHTML = '';

    series.forEach((seriesData, index) => {
        const booksSeries = books.filter(b => b.series === seriesData.id);

        if (booksSeries.length > 0) {
            grid.appendChild(createSeriesHeader(seriesData));

            const isCollapsed = collapsedSeries[seriesData.id];

            booksSeries.forEach(book => {
                const card = createBookCard(book);
                if (isCollapsed) card.style.display = 'none';
                grid.appendChild(card);
            });

            if (index < series.length - 1) {
                const spacer = document.createElement('div');
                spacer.className = 'series-spacer';
                grid.appendChild(spacer);
            }
        }
    });

    updateCounters();
}

renderBooks();

window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('scrollPosition', window.scrollY.toString());
});

window.addEventListener('load', () => {
    window.scrollTo(0, scrollPosition);
});

const scrollToTopBtn = document.getElementById('scrollToTopBtn');

function toggleScrollButton() {
    if (window.scrollY > 300) {
        scrollToTopBtn.classList.add('visible');
    } else {
        scrollToTopBtn.classList.remove('visible');
    }
}

scrollToTopBtn.addEventListener('click', () => {
    scrollToTopBtn.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => scrollToTopBtn.classList.remove('active'), 300);
});

scrollToTopBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    scrollToTopBtn.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => scrollToTopBtn.classList.remove('active'), 300);
    scrollToTopBtn.blur();
});

window.addEventListener('scroll', toggleScrollButton);
toggleScrollButton();

document.getElementById('collapseAllBtn')?.addEventListener('click', collapseAll);
document.getElementById('expandAllBtn')?.addEventListener('click', expandAll);
document.getElementById('themeToggle')?.addEventListener('click', toggleDarkMode);

function exportData() {
    const booksData = {};

    Object.keys(bookStates).forEach(key => {
        if (bookStates[key] !== 0) booksData[key] = bookStates[key];
    });

    const exportObj = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        books: booksData
    };

    return JSON.stringify(exportObj, null, 2);
}

function importData(jsonString) {
    try {
        const importObj = JSON.parse(jsonString);

        if (!importObj.version || !importObj.books) {
            return { success: false, message: 'Ungültiges JSON-Format. Erforderliche Felder fehlen.' };
        }

        const newBookStates = {};

        books.forEach(b => newBookStates[b.id] = 0);

        Object.keys(importObj.books).forEach(key => {
            if (newBookStates.hasOwnProperty(key)) {
                const state = parseInt(importObj.books[key]);
                if (state >= 0 && state <= 3) newBookStates[key] = state;
            }
        });

        bookStates = newBookStates;
        localStorage.setItem('bookStates', JSON.stringify(bookStates));
        renderBooks();

        return { success: true, message: 'Daten erfolgreich importiert!' };
    } catch (error) {
        return { success: false, message: `Import fehlgeschlagen: ${error.message}` };
    }
}

function resetAllData() {
    books.forEach(b => bookStates[b.id] = 0);

    localStorage.setItem('bookStates', JSON.stringify(bookStates));

    renderBooks();
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function showMessage(title, message, isSuccess = true, actions = []) {
    document.getElementById('messageTitle').textContent = title;

    const messageText = document.getElementById('messageText');
    messageText.textContent = message;

    if (isSuccess === 'warning') {
        messageText.className = 'warning-message';
    } else {
        messageText.className = isSuccess ? 'success-message' : 'error-message';
    }

    const actionsContainer = document.getElementById('messageActions');
    actionsContainer.innerHTML = '';

    actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = `control-btn ${action.class || ''}`;
        btn.textContent = action.text;
        btn.onclick = action.onClick;
        actionsContainer.appendChild(btn);
    });

    openModal('messageModal');
}

document.getElementById('exportBtn').addEventListener('click', () => {
    document.getElementById('exportData').value = exportData();
    openModal('exportModal');
});

document.getElementById('copyBtn').addEventListener('click', () => {
    const textarea = document.getElementById('exportData');
    textarea.select();
    document.execCommand('copy');

    const btn = document.getElementById('copyBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Kopiert!';
    setTimeout(() => btn.textContent = originalText, 2000);
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    const jsonData = document.getElementById('exportData').value;
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `die-drei-fragezeichen-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const result = importData(event.target.result);
        showMessage(
            result.success ? 'Import erfolgreich' : 'Import fehlgeschlagen',
            result.message,
            result.success,
            [{
                text: 'OK',
                class: result.success ? 'copy-btn' : 'export-btn',
                onClick: () => closeModal('messageModal')
            }]
        );
    };
    reader.readAsText(file);
    e.target.value = '';
});

document.getElementById('deleteBtn')?.addEventListener('click', () => {
    showMessage(
        'Alle Daten löschen',
        'Bist du sicher, dass du alle deine Daten löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden!',
        'warning',
        [
            {
                text: 'Abbrechen',
                class: 'collapse-btn',
                onClick: () => closeModal('messageModal')
            },
            {
                text: 'Alle Daten löschen',
                class: 'delete-btn',
                onClick: () => {
                    resetAllData();
                    closeModal('messageModal');
                    showMessage(
                        'Daten gelöscht',
                        'Alle Daten wurden erfolgreich gelöscht.',
                        true,
                        [{
                            text: 'OK',
                            class: 'copy-btn',
                            onClick: () => closeModal('messageModal')
                        }]
                    );
                }
            }
        ]
    );
});

document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.remove('show');
    });
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });
});