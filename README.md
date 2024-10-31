Clone this git repository by this command:
```bash
git clone https://github.com/bur1to/LinkedIn.git
```

After installing open project in your IDE and run this:
```bash
npm i
```
Maybe with @playwright/latest you need do next steps:
Choose JavaScript
Name of your Tests folder (default is tests or e2e if you already have a tests folder in your project) - live as test
Add a GitHub Actions workflow to easily run tests on CI - choose 'N'
Install Playwright browsers (default is true) - live as default

After installation put your LinkedIn login data in linkedin.js and run:
```bash
node linkedin.js
```
