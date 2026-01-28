let ifEnabled = true;
let shouldIgnoreCase = false;
let shouldIgnoreAccents = false;
let asianCharsEnabled = false;
let idleHintEnabled = true;
let idleHintDelayMs = 0;
const idleHintVisibleMs = 2000;
var typedWords = [];
const idleHintState = {};
let ctrlHintActive = false;
let ctrlHintListenersReady = false;
let activeTypeAnsIndex = null;

function checkFieldValue(reference, fieldIndex, event) {
    if (window.event.keyCode === 13) {
        pycmd("ans");
        return;
    }
    let field = $('#typeans' + fieldIndex);

    if (! ifEnabled) {
        updateTypedValue(fieldIndex);
        return;
    }

    let current = field.val();
    // console.log('Cur: ' + current + '; starts? ' + reference.startsWith(current));
    let previous = field.data('lastValue');

    if (suggestNextCharacter(field, current, reference, event)) {
        return;
    }

    current = current.trim();
    if (current == previous) {
        return;
    }

    cleanUpView(field);

    if (current == '' ) {
        field.data('lastValue', '');
        return;
    }

    if (shouldIgnoreCase) {
        current = current.toLowerCase();
        reference = reference.toLowerCase();
    }

    if (shouldIgnoreAccents) {
        current = current.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        reference = reference.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    if (current == reference) {
        field.addClass('st-ok');
    } else {
        if (reference.startsWith(current)) {            
            field.addClass('st-incomplete');
        } else {
            field.addClass('st-error');
        }
    }
    field.data('lastValue', current);
    updateTypedValue(fieldIndex);
    scheduleIdleHint(fieldIndex, reference);
}

function cleanUpView(field) {
    field.removeClass('st-ok');
    field.removeClass('st-incomplete');
    field.removeClass('st-error');
    field.removeClass('st-wrong-rect');
}

function suggestNextCharacter(field, current, reference, event) {
    if (field.hasClass('st-ok') || field.hasClass('st-error') || current.length >= reference.length) {
        return false;
    }

    if ((event.key === "?" && event.ctrlKey) || (isMacOS() && event.metaKey && event.shiftKey && event.key === '/')) {
        let nextChar = reference.charAt(current.length);
        field.val(current + nextChar);
        return true;
    }

    return false;
}

function isMacOS() {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

// ------------- Verification ---------------
function cleanUpTypedWords() {
    typedWords = [];
}

function prepareTypedWords(numFields) {
    for (let i = 0; i < numFields; i++) {
        typedWords.push("");
    }
}

function updateTypedValue(position) {
    let content = $("#typeans" + position).val().trim();
    typedWords[position] = content;
}

// --------------- Options ------------------

function disableInstantFb() {
    ifEnabled = false;
}

function ignoreCaseOnFeedback() {
    shouldIgnoreCase = true;
}

function ignoreAccentsOnFeedback() {
    shouldIgnoreAccents = true;
}

function enableAsianChars() {
    asianCharsEnabled = true;
}

function enableIdleHint() {
    idleHintEnabled = true;
}

function disableIdleHint() {
    idleHintEnabled = false;
    hideIdleHint();
}

function setIdleHintDelay(delayMs) {
    if (typeof delayMs === 'number' && delayMs >= 0) {
        idleHintDelayMs = delayMs;
    }
}

function enableReadingHighlight(force = false) {
    if (window.__ftbReadingHighlightEnabled && !force) {
        return;
    }
    window.__ftbReadingHighlightEnabled = true;
    const root = document.getElementById('qa') || document.body;
    wrapTextNodes(root);
}

// ------------------------------------

function focusOnFirst() {
    setTimeout(() => {
        try {
            $('#typeans0').focus();
        } catch (error) {
            console.warn(error);
        }        
    }, 300);   
}

function setUpFillBlankListener(expected, typeAnsIndex) {
    initCtrlHintListeners();
    const eventType = (asianCharsEnabled) ? "input" : "keyup"
    const inputEl = document.getElementById(`typeans${typeAnsIndex}`);
    if (!idleHintState[typeAnsIndex]) {
        idleHintState[typeAnsIndex] = { timerId: null, hideTimerId: null, expected: expected };
    } else {
        idleHintState[typeAnsIndex].expected = expected;
    }
    if (inputEl && inputEl.tagName === 'SELECT') {
        inputEl.addEventListener('change',
            (evt) => checkFieldValue(expected, typeAnsIndex, evt));
    } else {
        inputEl.addEventListener(eventType,
          (evt) => checkFieldValue(expected, typeAnsIndex, evt))
        inputEl.addEventListener('focus', () => {
            activeTypeAnsIndex = typeAnsIndex;
            scheduleIdleHint(typeAnsIndex, expected);
        });
        inputEl.addEventListener('blur', () => {
            if (activeTypeAnsIndex === typeAnsIndex) {
                activeTypeAnsIndex = null;
            }
            clearIdleHintTimer(typeAnsIndex);
        });
    }

    // add extra event for Enter key
    if (eventType === "input" && (!inputEl || inputEl.tagName !== 'SELECT')) {
        inputEl.addEventListener("keyup", (evt) => {
            if (window.event.keyCode === 13) {
                pycmd("ans");
            }
        })
    }

    inputEl.addEventListener("dblclick", (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        showRevealPopup(inputEl, expected, typeAnsIndex);
    });
}

// --------------- Idle hint popup ------------------
function getIdleHintPopup() {
    let popup = document.getElementById('ftb-idle-hint');
    if (popup) {
        return popup;
    }

    popup = document.createElement('div');
    popup.id = 'ftb-idle-hint';
    popup.className = 'ftb-idle-hint';
    popup.innerHTML = `
        <div class="ftb-idle-card">
            <div class="ftb-idle-title">Dica</div>
            <div class="ftb-idle-text"></div>
        </div>
    `;

    document.body.appendChild(popup);

    return popup;
}

function showIdleHint(inputEl, prefix) {
    const popup = getIdleHintPopup();
    const rect = inputEl.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 8;
    const left = rect.left + window.scrollX;

    const textEl = popup.querySelector('.ftb-idle-text');
    textEl.innerHTML = formatIdleHint(prefix || "");

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.classList.add('ftb-idle-open');
}

function hideIdleHint() {
    const popup = document.getElementById('ftb-idle-hint');
    if (popup) {
        popup.classList.remove('ftb-idle-open');
    }
}

function clearIdleHintTimer(fieldIndex) {
    const state = idleHintState[fieldIndex];
    if (state && state.timerId) {
        clearTimeout(state.timerId);
        state.timerId = null;
    }
    if (state && state.hideTimerId) {
        clearTimeout(state.hideTimerId);
        state.hideTimerId = null;
    }
    hideIdleHint();
}

function scheduleIdleHint(fieldIndex, expected) {
    if (!idleHintEnabled || !expected) {
        return;
    }

    const inputEl = document.getElementById(`typeans${fieldIndex}`);
    if (!inputEl || inputEl.tagName === 'SELECT') {
        return;
    }

    if (!idleHintState[fieldIndex]) {
        idleHintState[fieldIndex] = { timerId: null, hideTimerId: null, expected: expected };
    }

    const state = idleHintState[fieldIndex];
    if (!ctrlHintActive || activeTypeAnsIndex !== fieldIndex) {
        hideIdleHint();
        return;
    }
    const current = (inputEl.value || "").trim();

    if (state.timerId) {
        clearTimeout(state.timerId);
    }
    if (state.hideTimerId) {
        clearTimeout(state.hideTimerId);
        state.hideTimerId = null;
    }

    if (current.length >= expected.length) {
        hideIdleHint();
        return;
    }

    const runHint = () => {
        if (!ctrlHintActive || activeTypeAnsIndex !== fieldIndex) {
            hideIdleHint();
            return;
        }
        const liveValue = (inputEl.value || "").trim();
        if (liveValue.length >= expected.length) {
            hideIdleHint();
            return;
        }

        const nextCount = Math.min(expected.length, liveValue.length + 1);
        const prefix = expected.substring(0, nextCount);
        showIdleHint(inputEl, prefix);

        state.hideTimerId = setTimeout(() => {
            hideIdleHint();
        }, idleHintVisibleMs);
    };

    if (idleHintDelayMs === 0) {
        runHint();
    } else {
        state.timerId = setTimeout(runHint, idleHintDelayMs);
    }
}

function formatIdleHint(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\s/g, '<span class="ftb-idle-space"></span>');
}

function initCtrlHintListeners() {
    if (ctrlHintListenersReady) {
        return;
    }
    ctrlHintListenersReady = true;

    document.addEventListener('keydown', (evt) => {
        if (evt.key === 'Control' && !evt.shiftKey && !evt.altKey && !evt.metaKey) {
            ctrlHintActive = true;
            const activeIndex = getActiveTypeAnsIndex();
            if (activeIndex !== null && idleHintState[activeIndex]?.expected) {
                if (!idleHintState[activeIndex]) {
                    idleHintState[activeIndex] = { timerId: null, hideTimerId: null, expected: "" };
                }
                scheduleIdleHint(activeIndex, idleHintState[activeIndex].expected);
            }
        } else {
            ctrlHintActive = false;
            hideIdleHint();
        }
    });

    document.addEventListener('keyup', (evt) => {
        if (evt.key === 'Control') {
            ctrlHintActive = false;
            hideIdleHint();
        }
    });

    window.addEventListener('blur', () => {
        ctrlHintActive = false;
        hideIdleHint();
    });
}

function getActiveTypeAnsIndex() {
    const active = document.activeElement;
    if (!active || !active.id) {
        return null;
    }
    const match = active.id.match(/^typeans(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
}

// --------------- Reveal popup ------------------
let ftbPopupState = {
    field: null,
    expected: "",
    index: -1
};

function getRevealPopup() {
    let popup = document.getElementById('ftb-reveal-popup');
    if (popup) {
        return popup;
    }

    popup = document.createElement('div');
    popup.id = 'ftb-reveal-popup';
    popup.className = 'ftb-reveal-popup';
    popup.innerHTML = `
        <div class="ftb-reveal-card">
            <div class="ftb-reveal-title">Resposta</div>
            <div class="ftb-reveal-answer"></div>
            <div class="ftb-reveal-actions">
                <button type="button" class="ftb-btn ftb-btn-ok" title="Acertei">✓</button>
                <button type="button" class="ftb-btn ftb-btn-wrong" title="Errei">✕</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    popup.querySelector('.ftb-btn-ok').addEventListener('click', () => applyRevealChoice(true));
    popup.querySelector('.ftb-btn-wrong').addEventListener('click', () => applyRevealChoice(false));

    popup.addEventListener('click', (evt) => {
        evt.stopPropagation();
    });

    document.addEventListener('click', () => hideRevealPopup());
    document.addEventListener('keydown', (evt) => {
        if (evt.key === 'Escape') {
            hideRevealPopup();
        }
    });

    return popup;
}

function showRevealPopup(inputEl, expected, typeAnsIndex) {
    const popup = getRevealPopup();
    const rect = inputEl.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 8;
    const left = rect.left + window.scrollX;

    ftbPopupState = {
        field: inputEl,
        expected: expected,
        index: typeAnsIndex
    };

    const answerEl = popup.querySelector('.ftb-reveal-answer');
    answerEl.textContent = expected || "";

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.classList.add('ftb-reveal-open');
}

function hideRevealPopup() {
    const popup = document.getElementById('ftb-reveal-popup');
    if (popup) {
        popup.classList.remove('ftb-reveal-open');
    }
    ftbPopupState.field = null;
}

function applyRevealChoice(isCorrect) {
    if (!ftbPopupState.field) {
        hideRevealPopup();
        return;
    }

    const field = $(ftbPopupState.field);
    const expected = ftbPopupState.expected;
    field.val(expected);
    cleanUpView(field);

    if (isCorrect) {
        field.addClass('st-ok');
    } else {
        field.addClass('st-wrong-rect');
    }

    field.data('lastValue', expected);
    updateTypedValue(ftbPopupState.index);
    hideRevealPopup();
}

function wrapTextNodes(root) {
    if (!root) {
        return;
    }

    const skipTags = new Set(['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'SELECT']);
    const skipClasses = new Set(['ftb-container', 'ftb-reveal-popup', 'ftb-idle-hint', 'ftb-hover-word']);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
            if (!node.parentElement) {
                return NodeFilter.FILTER_REJECT;
            }
            if (skipTags.has(node.parentElement.tagName)) {
                return NodeFilter.FILTER_REJECT;
            }
            for (const cls of skipClasses) {
                if (node.parentElement.classList.contains(cls)) {
                    return NodeFilter.FILTER_REJECT;
                }
            }
            if (!node.nodeValue || !node.nodeValue.trim()) {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    });

    const nodes = [];
    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }

    nodes.forEach((textNode) => {
        const text = textNode.nodeValue;
        const parts = text.split(/(\s+)/);
        if (parts.length <= 1) {
            return;
        }

        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
            if (!part) {
                return;
            }
            if (/\s+/.test(part)) {
                frag.appendChild(document.createTextNode(part));
            } else {
                const span = document.createElement('span');
                span.className = 'ftb-hover-word';
                span.textContent = part;
                frag.appendChild(span);
            }
        });

        textNode.parentNode.replaceChild(frag, textNode);
    });
}