/**
 * bővítmény inicializálása
 * @author sarkiroka on 2020.08.14.
 */
const DEBUG = false;

function debug() {
	if (DEBUG) {
		console.log.apply(null, arguments);
	}
}

let lorumIpseNextText = '';

function sendText(id, noMoreTry) {
	debug('lorum ipse elküldésre kerül', {last: noMoreTry});
	chrome.tabs.sendMessage(id, {action: 'fill-with-lorum-ipse', text: lorumIpseNextText}, function (p) {
		if (chrome.runtime.lastError) {
			debug('opszli', chrome.runtime.lastError.message);
			if (!noMoreTry) {
				sendText(id, true);
			}
		}
	});
}

function getNextText(callback) {
	const apiUrl = 'http://www.lorumipse.hu/generate/';
	const KIND_OF_WORD = 2;
	const THE_WORD = 0;
	const WORD_ALIGN = 3;
	const ALIGN_LEFT = 'left';
	const EMPTY_STRING = '';
	const SPACE = ' ';
	const PUNCTIATION = 'PUNCT';

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			let response = JSON.parse(xhr.responseText);
			const createSentence = words => words.reduce((sentence, wordDefinition) => {
				let notNeedSpace = !sentence || (wordDefinition[KIND_OF_WORD] == PUNCTIATION && wordDefinition[WORD_ALIGN] == ALIGN_LEFT);
				sentence += (notNeedSpace ? EMPTY_STRING : SPACE) + wordDefinition[THE_WORD];
				return sentence;
			}, EMPTY_STRING);
			let text = response.map(createSentence).join(' ');
			lorumIpseNextText = text;
			debug('lórum ipse elmondta');
			if (callback) {
				callback();
			}
		}
	};
	xhr.open('GET', apiUrl, true);
	xhr.send();
}

getNextText();

chrome.browserAction.onClicked.addListener(function (tab) {
	if (lorumIpseNextText) {
		sendText(tab.id);
		getNextText();
	} else {
		getNextText(() => {
			sendText(tab.id);
		})
	}
});

chrome.contextMenus.create({
	title: 'Lórum Ipse mondja',
	contexts: ['editable'],
	onclick: (info, tab) => {
		sendText(tab.id);
	}
});
