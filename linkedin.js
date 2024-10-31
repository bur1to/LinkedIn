const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const fs = require('fs').promises;
const FS = require('fs');

chromium.use(stealth);

const url = 'https://www.linkedin.com';
const cookiesPath = './cookies.json';

const logFile = FS.createWriteStream('./out.log', { flags: 'a' });

console.log = (msg) => logFile.write(`[LOG] ${new Date().toISOString()} - ${msg}\n`);
console.error = (msg) => logFile.write(`[ERROR] ${new Date().toISOString()} - ${msg}\n`);
console.warn = (msg) => logFile.write(`[WARN] ${new Date().toISOString()} - ${msg}\n`);

const saveCookies = async (context) => {
  const cookies = await context.cookies();
  await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2));
  console.log('Cookies saved successfully!');
};

const loadCookies = async (context) => {
  const cookiesData = await fs.readFile(cookiesPath, 'utf-8');
  const cookies = JSON.parse(cookiesData);
  await context.addCookies(cookies);
  console.log('Cookies loaded successfully!');
};

// First time when you login you need to do it manually in case when reCAPTCHA appear
const linkedInLogin = async (page, context) => {
  try {
    // Load cookies if available
    const cookiesExist = await fs.access(cookiesPath).then(() => true).catch(() => false);
    if (cookiesExist) {
      await loadCookies(context);
      await page.goto(url);
      console.log('Logged in using saved cookies.');
      return;
    }

    // No cookies available, so log in manually
    await page.goto(`${url}/login`);
    await page.fill('#username', 'your email/phone'); // Your LinkedIn email/phone
    await page.fill('#password', 'your password'); // Your LinkedIn password
    await page.click('button[data-litms-control-urn="login-submit"]');
    await page.waitForNavigation();

    // Save cookies after successful login
    await saveCookies(context);
  } catch (error) {
    console.error('Error during login:', error);
  }
};

const downloadImage = async (imageUrl, filepath) => {
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  await fs.writeFile(filepath, response.data);
  console.log('Image downloaded successfully!');
};

const navigateToProfile = async (page) => {
  await page.click('.global-nav__primary-link-me-menu-trigger');
  await page.waitForSelector('.artdeco-dropdown__content-inner', { state: 'visible' });

  const profileUrl = await page.$eval(
    '.artdeco-dropdown__content-inner .display-flex.mt2.full-width a',
    (anchor) => anchor.getAttribute('href')
  );

  if (profileUrl) {
    await page.goto(`${url}${profileUrl}`);
  } else {
    console.log('Profile link not found.');
  }
};

const scrapeProfilePhoto = async (page) => {
  const profilePhotoUrl = await page.getAttribute('img.profile-photo-edit__preview', 'src');
  if (profilePhotoUrl) {
    const filepath = './profilePhoto.jpg';
    await downloadImage(profilePhotoUrl, filepath);
  } else {
    console.log('Profile photo not found');
  }
};

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await linkedInLogin(page, context);
  await navigateToProfile(page);
  await scrapeProfilePhoto(page);

  await browser.close();
})();

