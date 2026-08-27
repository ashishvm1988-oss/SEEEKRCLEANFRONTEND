import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const rand = Math.floor(Math.random() * 1e6);
const customerEmail = `qa_customer_${rand}@example.com`;
const providerEmail = `qa_provider_${rand}@example.com`;
const password = 'password123';

const shots = '/home/claude/work/seeekr-frontend/screenshots';
await (await import('fs/promises')).mkdir(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const consoleErrors = [];

function attachConsole(page, label) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[${label}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => consoleErrors.push(`[${label}] pageerror: ${err.message}`));
}

async function step(name, fn) {
  try {
    await fn();
    console.log(`OK   - ${name}`);
  } catch (err) {
    console.log(`FAIL - ${name}: ${err.message}`);
    throw err;
  }
}

// ---------- Provider: signup ----------
const providerPage = await browser.newPage();
attachConsole(providerPage, 'provider');

await step('provider signup page loads', async () => {
  await providerPage.goto(`${BASE}/signup`);
  await providerPage.waitForSelector('text=Create your account');
});

await step('provider fills signup form', async () => {
  await providerPage.click('text=I provide a service');
  await providerPage.fill('#username', `qa_provider_${rand}`);
  await providerPage.fill('#email', providerEmail);
  await providerPage.fill('#password', password);
  await providerPage.fill('#city', 'Bangalore');
  await providerPage.fill('#about', 'QA test provider for e2e verification');
  await providerPage.waitForSelector('.tag-grid .tag', { timeout: 10000 });
  const tags = await providerPage.$$('.tag-grid .tag');
  await tags[0].click();
  await tags[1].click();
});

await step('provider submits signup and lands on home', async () => {
  await providerPage.click('button:has-text("Sign up")');
  await providerPage.waitForURL('**/home', { timeout: 10000 });
  await providerPage.waitForSelector('text=Browse categories');
});
await providerPage.screenshot({ path: `${shots}/01-provider-home.png` });

await step('provider home shows location + categories', async () => {
  await providerPage.waitForSelector('.location-pill:has-text("Bangalore")');
  const tiles = await providerPage.$$('.category-tile');
  if (tiles.length < 5) throw new Error(`expected several categories, got ${tiles.length}`);
});

await step('provider account shows trial subscription', async () => {
  await providerPage.click('a:has-text("Account")');
  await providerPage.waitForSelector('text=Your plan');
  await providerPage.waitForSelector('.plan-card .status-pill:has-text("trial")');
  await providerPage.waitForSelector('text=₹1000 / month');
});
await providerPage.screenshot({ path: `${shots}/02-provider-account.png` });

// ---------- Customer: signup ----------
const customerPage = await browser.newPage();
attachConsole(customerPage, 'customer');

await step('customer signup', async () => {
  await customerPage.goto(`${BASE}/signup`);
  await customerPage.fill('#username', `qa_customer_${rand}`);
  await customerPage.fill('#email', customerEmail);
  await customerPage.fill('#password', password);
  await customerPage.fill('#city', 'Bangalore');
  await customerPage.click('button:has-text("Sign up")');
  await customerPage.waitForURL('**/home', { timeout: 10000 });
});
await customerPage.screenshot({ path: `${shots}/03-customer-home.png` });

await step('customer drills into a category', async () => {
  await customerPage.click('.category-tile >> nth=0');
  await customerPage.waitForSelector('.tag-grid .tag, .empty-state');
});
await customerPage.screenshot({ path: `${shots}/04-category-detail.png` });

customerPage.on('response', async (r) => {
  if (r.url().includes('/providers')) console.log('  [debug] response', r.url(), r.status());
});

await step('customer searches for the QA provider by name', async () => {
  await customerPage.click('a:has-text("Search")');
  await customerPage.waitForSelector('.search-bar input', { timeout: 5000 });
  await customerPage.fill('.search-bar input >> nth=0', `qa_provider_${rand}`);
  console.log('  [debug] url before submit', customerPage.url());
  await customerPage.click('button:has-text("Search")');
  await customerPage.waitForTimeout(1000);
  console.log('  [debug] url after submit', customerPage.url());
  await customerPage.waitForSelector('.provider-card, .empty-state', { timeout: 8000 });
  const card = await customerPage.$('.provider-card');
  if (!card) {
    const html = await customerPage.$eval('.screen', (el) => el.innerHTML.slice(0, 1500));
    console.log('  [debug] screen html:', html);
    throw new Error('QA provider not found in search results');
  }
});
await customerPage.screenshot({ path: `${shots}/05-search-results.png` });

let providerId;
await step('customer opens provider profile', async () => {
  await customerPage.click('.provider-card >> nth=0');
  await customerPage.waitForSelector('.profile-hero h2');
  const url = customerPage.url();
  providerId = url.split('/provider/')[1];
  await customerPage.waitForSelector(`text=QA test provider for e2e verification`);
  await customerPage.waitForSelector('.chip-row .chip');
});
await customerPage.screenshot({ path: `${shots}/06-provider-profile.png` });

await step('customer messages the provider', async () => {
  await customerPage.click('button:has-text("Message")');
  await customerPage.waitForSelector('.composer input');
  await customerPage.fill('.composer input', 'Hi! Are you available next week for a project?');
  await customerPage.click('.composer button');
  await customerPage.waitForSelector('.bubble.mine:has-text("Are you available next week")');
});
await customerPage.screenshot({ path: `${shots}/07-chat-thread-customer.png` });

await step('provider sees the conversation and replies', async () => {
  await providerPage.click('a:has-text("Chat")');
  await providerPage.waitForSelector('.conversation-row', { timeout: 8000 });
  await providerPage.click('.conversation-row >> nth=0');
  await providerPage.waitForSelector('.bubble.theirs:has-text("Are you available next week")', { timeout: 8000 });
  await providerPage.fill('.composer input', 'Yes, I have availability. Let\'s connect!');
  await providerPage.click('.composer button');
  await providerPage.waitForSelector('.bubble.mine:has-text("Let\'s connect")');
});
await providerPage.screenshot({ path: `${shots}/08-chat-thread-provider.png` });

await step('customer sees provider reply via polling', async () => {
  await customerPage.waitForSelector('.bubble.theirs:has-text("Let\'s connect")', { timeout: 8000 });
});
await customerPage.screenshot({ path: `${shots}/09-chat-reply-received.png` });

await step('customer chat list shows the conversation', async () => {
  await customerPage.click('a:has-text("Chat")');
  await customerPage.waitForSelector('.conversation-row');
});
await customerPage.screenshot({ path: `${shots}/10-customer-chatlist.png` });

await step('customer can edit their account profile', async () => {
  await customerPage.click('a:has-text("Account")');
  await customerPage.waitForSelector('.menu-item');
  await customerPage.click('.menu-item >> nth=0');
  await customerPage.fill('#acc-about', 'Looking for reliable local services');
  await customerPage.click('button:has-text("Save changes")');
  await customerPage.waitForSelector('.menu-item:has-text("Edit")');
});
await customerPage.screenshot({ path: `${shots}/11-account-edit.png` });

await step('logout returns to login screen', async () => {
  await customerPage.click('button:has-text("Log out")');
  await customerPage.waitForURL('**/login', { timeout: 8000 });
});

await step('re-login works', async () => {
  await customerPage.fill('#identifier', customerEmail);
  await customerPage.fill('#password', password);
  await customerPage.click('button:has-text("Log in")');
  await customerPage.waitForURL('**/home', { timeout: 8000 });
});

await browser.close();

console.log('\n--- Console/page errors captured during run ---');
if (consoleErrors.length === 0) console.log('(none)');
else consoleErrors.forEach((e) => console.log(e));

console.log('\nALL STEPS PASSED');
