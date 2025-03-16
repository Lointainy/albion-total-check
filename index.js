const fs = require('fs');
const path = require('path');

let XLSX;
try {
	XLSX = require('xlsx');
	console.log('xlsx package found');
} catch (error) {
	console.log('xlsx package not found, skipping Excel operations');
}

const inputFileName = 'data.txt';
const files = ['DATA_USERS', 'DATA_TOTAL', 'DATA_DEBTOR'];

const OUTPUT_DIR = path.join(__dirname, 'OUTPUT');
const INPUT_DIR = path.join(__dirname, 'INPUT');
const DATA_PATH = path.join(INPUT_DIR, inputFileName);
const TEMP_DIR = path.join(__dirname, 'temp');
const ENERGY_PATH = path.join(TEMP_DIR, 'energy.json');

if (!fs.existsSync(TEMP_DIR)) {
	fs.mkdirSync(TEMP_DIR, { recursive: true });
	console.log('TEMP folder created');

	if (!fs.existsSync(ENERGY_PATH)) {
		fs.writeFileSync(ENERGY_PATH, '');
		console.log('Energy JSON file created');
	}
}

fs.writeFileSync('temp/energy.json', '');

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

	fs.writeFileSync('temp/energy.json', JSON.stringify(jsonData, null, 4));

	const usersData = [['Player', 'Total Amount', 'Total Withdrawal', 'Total']];
	const totalData = [['Player', 'Total']];
	const debtorData = [['Player', 'Debt']];

	for (const player in playerStats) {
		const { totalAmount, totalWithdraw, total } = playerStats[player];
		usersData.push([player, totalAmount, totalWithdraw, total]);
		totalData.push([player, total]);

		if (total < 0) {
			debtorData.push([player, total]);
		}
	}

	const fileContents = [
		{
			name: files[0],
			content: {
				txt: formatDataForTxt(usersData),
				xls: usersData
			}
		},
		{
			name: files[1],
			content: {
				txt: formatDataForTxt(totalData),
				xls: totalData
			}
		},
		{
			name: files[2],
			content: {
				txt: formatDataForTxt(debtorData),
				xls: debtorData
			}
		}
	];

	fileContents.forEach(({ name, content }) => {
		fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.txt`), content.txt);

		if (XLSX) {
			generateExcelFile(`${name}.xlsx`, content.xls);
		}
	});

	console.log('DATA saved');
});

function formatDataForTxt(data, delimiter = '\t') {
	return data.map((row) => row.join(delimiter)).join('\n');
}

function generateExcelFile(fileName, data) {
	const worksheet = XLSX.utils.aoa_to_sheet(data);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
	XLSX.writeFile(workbook, path.join(OUTPUT_DIR, fileName));
}
