const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const EXTENSION = '.pdf';
const csvOptions = {
	path: 'out.csv',
	header: [
		{id: 'b/s', title: 'B/S'},
		{id: 'trade_date', title: 'Trade Date'},
		{id: 'settle_date', title: 'Settle Date'},
		{id: 'qty', title: 'QTY'},
		{id: 'sym', title: 'SYM'},
		{id: 'price', title: 'Price'},
		{id: 'principal', title: 'Principal'},
		{id: 'comm', title: 'COMM'},
		{id: 'tran_fee', title: 'Tran Fee'},
		{id: 'addl_fees', title: 'Add\'l Fees'},
	]
}
const csvWriter = createCsvWriter(csvOptions);
const rows = [];

fs.readdir('./', function(err, files) {
	// do something with your files, by the way they are just filenames...
	const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === EXTENSION);
	for (let i = 0; i < pdfFiles.length; i++) {
		const dataBuffer = fs.readFileSync(pdfFiles[i]);
		pdf(dataBuffer, options).then(function (data) {
			const textArr = data.text.split('\n').slice(53); // hard-coded start of array

			let dataObj = {};

			for (let i = 0; i < textArr.length; i++) {
				const word = textArr[i];
				if ((word === 'B' || word === 'S' && textArr[i+1])) {
					// need to check if its start of row
					// look ahead to see if next item is date
					const nextIsDate = /^\d{1,2}\/\d{1,2}\/\d{2}/.test(textArr[i + 1]);
					if (nextIsDate) {
						for (let j = 0; j < csvOptions.header.length; j++) {
							const { id } = csvOptions.header[j];
							dataObj[id] = textArr[j+i];
						}
						rows.push(dataObj);
						dataObj = {};
					}
				}

			}

			return csvWriter
			.writeRecords(rows)
			.then(()=> console.log('The CSV file was written successfully'));
						
		});

	}
})

// render callback
function render_page(pageData) {
	//check documents https://mozilla.github.io/pdf.js/
	let render_options = {
			//replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
			normalizeWhitespace: false,
			//do not attempt to combine same line TextItem's. The default value is `false`.
			disableCombineTextItems: false
	}

	return pageData.getTextContent(render_options)
		.then(function (textContent) {
			if (pageData.pageIndex > 0) {
				let lastY, text = '';
				for (let item of textContent.items) {
					if (lastY == item.transform[5] || !lastY){
						text += item.str;
					} else {
						text += '\n' + item.str;
					}    
					lastY = item.transform[5];
				}
				return text;
			}
			return '';
	});
}

let options = {
  pagerender: render_page
}

