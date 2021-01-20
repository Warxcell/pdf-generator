const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

function rawBody(req, res, next) {
    req.setEncoding('utf8');
    req.rawBody = '';
    req.on('data', function (chunk) {
        req.rawBody += chunk;
    });
    req.on('end', function () {
        next();
    });
}

app.use(rawBody);

app.post('/', async (req, res) => {
    try {
        console.log("Converting...");

        const pdf = await generatePDF(req.rawBody);

        res.set('Content-Type', 'application/pdf');
        res.set('Content-Length', pdf.length);
        res.send(pdf);
    } catch (e) {
        console.error(e);
        return res.sendStatus(500);
    }
});

app.listen(3000, () => {
    console.log('Listening');
});

async function generatePDF(html) {
    console.log("Launching browser...");

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
    });

    try {
        console.log("Opening new page...");

        const page = await browser.newPage();

        page.on('requestfailed', request => {
            console.log(`url: ${request.url()}, errText: ${request.failure().errorText}, method: ${request.method()}`)
        });
        // Catch console log errors
        page.on("pageerror", err => {
            console.log(`Page error: ${err.toString()}`);
        });

        console.log("Setting content...");
        await page.setContent(html, {'waitUntil': 'networkidle0'});

        console.log("Print to PDF...");

        return await page.pdf({format: 'A4', printBackground: true});
    } catch (e) {
        console.error(e);
    } finally {
        console.log("Close browser...");
        await browser.close();
    }
}