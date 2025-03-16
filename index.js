const fs = require('fs');
const path = require('path');

const inputFileName = 'data.txt';
const files = ['DATA_USERS.txt', 'DATA_TOTAL.txt', 'DATA_DEBTOR.txt'];

const OUTPUT_DIR = path.join(__dirname, 'OUTPUT');
const INPUT_DIR = path.join(__dirname, 'INPUT');
const DATA_PATH = path.join(INPUT_DIR, inputFileName);

fs.writeFileSync('data/energy.json', '');

if (!fs.existsSync(OUTPUT_DIR)) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
	console.log('OUTPUT folder created');
}

if (!fs.existsSync(INPUT_DIR)) {
	fs.mkdirSync(INPUT_DIR, { recursive: true });
	console.log('INPUT folder created');
}

if (!fs.existsSync(DATA_PATH)) {
	fs.writeFileSync(DATA_PATH, 'ENTER DATA HERE');
	console.log('DATA file is created:', DATA_PATH);
}

fs.readFile(DATA_PATH, 'utf8', (err, data) => {
	if (err) {
		console.error('ERROR reading file:', err);
		return;
	}

	const lines = data.trim().split('\n');

	// BUG - work only if main lang is ENG
	// if (!lines[0].includes('Date') || !lines[0].includes('Player') || !lines[0].includes('Reason') || !lines[0].includes('Amount')) {
	// 	console.error('Invalid file format');
	// 	return;
	// }

	lines.shift();

	let jsonData = [];

	for (const line of lines) {
		const parts = line.split('\t');
		if (parts.length !== 4) {
			console.error(`Invalid data format: ${line}`);
			continue;
		}

		const [date, player, reason, amount] = parts;

		jsonData.push({
			date: date.replace(/"/g, ''),
			player: player.replace(/"/g, ''),
			reason: reason.replace(/"/g, ''),
			amount: parseFloat(amount.replace(/"/g, ''))
		});
	}

	jsonData.sort((a, b) => a.player.localeCompare(b.player));

	const playerStats = {};

	jsonData.forEach(({ player, reason, amount }) => {
		if (!playerStats[player]) {
			playerStats[player] = { totalAmount: 0, totalWithdraw: 0, total: 0 };
		}

		if (amount < 0) {
			playerStats[player].totalWithdraw += amount;
		}

		if (amount > 0) {
			playerStats[player].totalAmount += amount;
		}

		playerStats[player].total = playerStats[player].totalAmount + playerStats[player].totalWithdraw;
	});

	fs.writeFileSync('data/energy.json', JSON.stringify(jsonData, null, 4));

	generateFiles();

	let resultText = 'Player\tTotal Amount\tTotal Withdrawal\tTotal\n';
	let totalText = 'Player\tTotal\n';
	let debtorText = 'Player\tDebt\n';

	for (const player in playerStats) {
		const { totalAmount, totalWithdraw, total } = playerStats[player];

		resultText += `${player}\t${totalAmount}\t${totalWithdraw}\t${total}\n`;
		totalText += `${player}\t${total}\n`;

		if (total < 0) {
			debtorText += `${player}\t${total}\n`;
		}
	}

	const fileContents = [
		{ name: files[0], content: resultText },
		{ name: files[1], content: totalText },
		{ name: files[2], content: debtorText }
	];

	fileContents.forEach(({ name, content }) => {
		fs.writeFileSync(path.join(OUTPUT_DIR, name), content);
	});

	console.log('DATA saved');
});

function generateFiles() {
	files.forEach((file) => {
		const filePath = path.join(OUTPUT_DIR, file);
		fs.writeFileSync(filePath, '');
	});
}

