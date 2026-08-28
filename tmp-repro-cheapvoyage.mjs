import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--window-size=1400,900"],
});
const page = await browser.newPage();
await page.setCacheEnabled(false);
page.on("console", (msg) => console.log("C", msg.text()));

await page.goto("http://localhost:3000/", { waitUntil: "networkidle0", timeout: 60000 });
await page.evaluate(() => {
  setInterval(() => {
    console.log(
      "tick",
      location.pathname,
      document.querySelector(".case-study-morph-root")?.getAttribute("data-phase"),
    );
  }, 400);
});

const tile = await page.waitForSelector('a[href*="cheap-voyage"]');
await tile.click();
await new Promise((r) => setTimeout(r, 2500));
console.log("url after click wait", page.url());

console.log("forcing href from evaluate");
await page.evaluate(() => {
  window.location.href = "/case-studies/cheap-voyage/";
});
await new Promise((r) => setTimeout(r, 2000));
console.log("url after force", page.url());
console.log(await page.evaluate(() => document.querySelector("h1")?.textContent));
await browser.close();
