#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GraphQL endpoint
const ENDPOINT = 'https://bpacfwpgraphql.wpengine.com/graphql/';

// Directory to store the documentation
const OUTPUT_DIR = path.join(__dirname, 'wpgraphql-for-acf');

// GraphQL query to fetch all pages
const pagesQuery = `
  query GetAllPages {
    pages(first: 100) {
      nodes {
        uri
        title
        content
      }
    }
  }
`;

// GraphQL query to fetch all field types
const fieldTypesQuery = `
  query GetFieldTypes {
    allFieldType(first: 100) {
      nodes {
        uri
        title
        content
      }
    }
  }
`;

// Create the output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
	console.log(`Created directory: ${OUTPUT_DIR}`);
}

// Function to make the GraphQL request
async function fetchPages() {
	try {
		const response = await fetch(ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ query: pagesQuery })
		});

		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const data = await response.json();
		return data.data.pages.nodes;
	} catch (error) {
		console.error('Error fetching pages:', error);
		throw error;
	}
}

async function fetchFieldTypes() {
	try {
		const response = await fetch(ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ query: fieldTypesQuery })
		});

		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const data = await response.json();
		return data.data.allFieldType.nodes;
	} catch (error) {
		console.error('Error fetching field types:', error);
		throw error;
	}
}

// Function to create HTML file for a page
function createHtmlFile(page) {
	const { title, uri, content } = page;

	// Skip pages with null uri
	if (!uri) {
		console.warn(`Skipping page with title "${title}" because it has no URI`);
		return;
	}

	// Skip pages with null content
	if (!content) {
		console.warn(`Skipping page with title "${title}" because it has no content`);
		return;
	}

	// Remove leading and trailing slashes from URI
	const cleanUri = uri.replace(/^\/|\/$/, '');

	// Determine the file path
	let filePath;
	if (cleanUri.includes('/')) {
		// For nested paths like '/field-types/user-roles/'
		const segments = cleanUri.split('/');
		const fileName = segments.pop() || 'index'; // Use the last segment as filename
		const dirPath = path.join(OUTPUT_DIR, ...segments);

		// Create nested directories if needed
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true });
			console.log(`Created directory: ${dirPath}`);
		}

		filePath = path.join(dirPath, `${fileName}.html`);
	} else if (cleanUri === '') {
		// For the root page
		filePath = path.join(OUTPUT_DIR, 'index.html');
	} else {
		// For pages at the root level
		filePath = path.join(OUTPUT_DIR, `${cleanUri}.html`);
	}

	// Create HTML content
	const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
  <h1>${title}</h1>
  ${content}
</body>
</html>
  `.trim();

	// Write to file
	fs.writeFileSync(filePath, htmlContent);
	console.log(`Created file: ${filePath}`);
}

// Main function
async function main() {
	try {
		console.log('Fetching pages from WPGraphQL for ACF...');
		const pages = await fetchPages();
		console.log(`Found ${pages.length} pages.`);

		console.log('Fetching field types from WPGraphQL for ACF...');
		const fieldTypes = await fetchFieldTypes();
		console.log(`Found ${fieldTypes.length} field types.`);

		// Create HTML files for each page and field type
		pages.forEach((page) => {
			createHtmlFile(page);
		});
		fieldTypes.forEach((fieldType) => {
			createHtmlFile(fieldType);
		});

		console.log('Documentation generation complete!');
	} catch (error) {
		console.error('Error generating documentation:', error);
		process.exit(1);
	}
}

// Run the script
main();
