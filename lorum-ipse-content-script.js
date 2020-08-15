/**
 * Lórum Ipse szöveg érkezte esetén az aktuális input mező aktuális poziciójába betölti a szöveget
 * legalábbis megpróbálja ezt
 * @author sarkiroka on 2020.08.14.
 */
const DEBUG = false;
const MAX_ITERATION_COUNT = 50;

function debug() {
	if (DEBUG) {
		console.log.apply(null, arguments);
	}
}

debug('lorum ipse figyel');

function getActiveElement(document, iterationCount = 0) {
	if (iterationCount > MAX_ITERATION_COUNT) {
		return false;
	}
	document = document || window.document;
	if (document.body === document.activeElement || document.activeElement.tagName == 'IFRAME') {
		// Get iframes
		var iframes = document.getElementsByTagName('iframe');
		for (let i = 0; i < iframes.length; i++) {
			let focused = getActiveElement(iframes[i].contentWindow.document, iterationCount + 1);
			if (focused !== false) {
				return focused; // The focused
			}
		}
	} else {
		let focused = document.activeElement;
		while (focused.shadowRoot && focused.shadowRoot.activeElement && iterationCount < MAX_ITERATION_COUNT) {
			focused = focused.shadowRoot.activeElement;
			iterationCount++;
		}
		return focused;
	}

	return false;
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.action == 'fill-with-lorum-ipse') {
		let element = null;
		try {
			element = getActiveElement(document);
		} catch (e) {
			console.warn('nem lehet elérni az aktív elemet', e);
			sendResponse(false);
		}
		debug('lorum ipse íróját megszólították', {message, element});
		if (element) {
			const VALID_TYPES = ['TEXT', 'SEARCH'];
			const isTextInputField = element.tagName.toUpperCase() == 'INPUT' && (element.getAttribute('type') == null || VALID_TYPES.includes(element.getAttribute('type').toUpperCase()));
			const isTextarea = element.tagName == 'TEXTAREA';
			const oldValue = element.value;
			let newValue = '';
			let position = 0;
			element.focus();
			if (isTextInputField) {
				const start = element.selectionStart;
				const end = element.selectionEnd;
				newValue = oldValue.substr(0, start) + message.text + oldValue.substr(end);
				position = start + message.text.length;
				element.value = newValue;
				element.setSelectionRange(position, position);
			} else if (isTextarea) {
				const selection = document.getSelection();
				const start = Math.min(selection.anchorOffset, selection.focusOffset);
				const end = Math.max(selection.anchorOffset, selection.focusOffset);

				newValue = oldValue.substr(0, start) + message.text + oldValue.substr(end);
				element.value = newValue;
				position = start + message.text.length;
				try {
					const range = document.createRange();
					range.setStart(element, position);
					range.setEnd(element, position);
					range.collapse(true);
					selection.removeAllRanges();
					selection.addRange(range);
				} catch (e) {
					element.setSelectionRange(position, position);
				}
			} else {
				console.warn('there is no active input element', element);
			}
			sendResponse(true);
		}
	} else {
		sendResponse(false);
	}
});
