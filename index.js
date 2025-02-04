const core = require('@actions/core');
const https = require('https');
const { parse } = require('node-html-parser');

async function fetchURL(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function checkStatus(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  try {
    // Get URL from secrets
    const url = process.env.URL;

    if (!url) {
      core.setFailed('URL secret is not set');
      return;
    }

    console.log(`Fetching HTML from ${url}`);

    const html = await fetchURL(url);
    const root = parse(html);

    const cssLinks = root.querySelectorAll('link[rel="stylesheet"]')
                         .map(link => link.getAttribute('href'))
                         .filter(href => href); // Remove null/undefined values

    if (cssLinks.length === 0) {
      core.setFailed('No CSS links found in the HTML');
      return;
    }

    console.log(`Found ${cssLinks.length} CSS links`);

    // Check each CSS URL
    for (const cssLink of cssLinks) {
      // Handle relative URLs
      const cssUrl = cssLink.startsWith('http')
        ? cssLink
        : new URL(cssLink, url).toString();

      console.log(`Checking CSS URL: ${cssUrl}`);

      try {
        const statusCode = await checkStatus(cssUrl);

        if (statusCode !== 200) {
          core.setFailed(`CSS URL ${cssUrl} returned status code ${statusCode}`);
          return;
        }

        console.log(`CSS URL ${cssUrl} is accessible (status code 200)`);
      } catch (error) {
        core.setFailed(`Failed to check CSS URL ${cssUrl}: ${error.message}`);
      }
    }

    core.setOutput('✅ All CSS URLs are accessible');
  } catch (error) {
    core.setFailed(`☠️ Action failed: ${error.message}`);
  }

  return;
}

run();
