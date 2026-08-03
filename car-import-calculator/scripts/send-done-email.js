#!/usr/bin/env node
/**
 * send-done-email.js
 *
 * Zero-dependency email sender for the car import calculator completion notice.
 * Uses Node's built-in net/tls modules (no nodemailer needed).
 *
 * Send to mgarrigan@gmail.com via Gmail SMTP (smtp.gmail.com:465, implicit TLS).
 *
 * REQUIRED credentials (choose ONE):
 *   1. Environment variables:
 *        $env:GMAIL_USER="your.gmail@gmail.com"
 *        $env:GMAIL_APP_PASSWORD="16-char app password"
 *      then:  node send-done-email.js
 *   2. CLI arguments:
 *        node send-done-email.js your.gmail@gmail.com "16-char app password"
 *
 * The "from" address is the Gmail account; the recipient is mgarrigan@gmail.com.
 */
'use strict';

const net = require('net');
const tls = require('tls');

const HOST = 'smtp.gmail.com';
const PORT = 465;

const TO = 'mgarrigan@gmail.com';
const SUBJECT = 'Car Import Cost Calculator — Live!';
const BODY =
`Hi,

Your UK / Northern Ireland → Republic of Ireland car import cost calculator is DONE and live:

  https://familyai-cyber.github.io/car-import-calculator/

Features:
• Enter make, model, year and UK price (GBP)
• Live GBP→EUR conversion (with fallback rate)
• Choose GB mainland vs Northern Ireland registration (affects customs duty 10% vs 0% and import VAT 23% vs 0%)
• Choose private buyer vs VAT-registered dealer (import VAT reclaimable for dealers)
• Full breakdown: customs duty, import VAT, VRT (20 bands) + NOx levy, OMSP, registration fee, NCT, shipping, annual motor tax estimate

Questions or tweaks? Just reply to this thread.

— Copilot
`;

// ---------------------------------------------------------------- helpers

function encodeBase64(str) {
  return Buffer.from(str, 'utf8').toString('base64');
}

function parseReply(line) {
  const m = /^(\d{3})([ -])(.*)$/.exec(line);
  return m ? { code: parseInt(m[1], 10), cont: m[2] === '-', text: m[3] } : { code: 0, cont: false, text: line };
}

// ---------------------------------------------------------------- main

function getArgs() {
  const fromEnvUser = process.env.GMAIL_USER;
  const fromEnvPass = process.env.GMAIL_APP_PASSWORD;
  const argUser = process.argv[2];
  const argPass = process.argv[3];
  const user = fromEnvUser || argUser;
  const pass = fromEnvPass || argPass;
  return { user, pass };
}

function fail(message) {
  console.error('✖ ' + message);
  process.exit(1);
}

function main() {
  const { user, pass } = getArgs();
  if (!user || !pass) {
    fail(
      'Missing Gmail credentials.\n' +
      'You need a Gmail account and an "app password":\n' +
      '  1. Enable 2-Step Verification: https://myaccount.google.com/security\n' +
      '  2. Create an App Password:     https://myaccount.google.com/apppasswords\n' +
      '  3. Run one of:\n' +
      '       $env:GMAIL_USER="your@gmail.com"; $env:GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"; node send-done-email.js\n' +
      '     or\n' +
      '       node send-done-email.js your@gmail.com "xxxx xxxx xxxx xxxx"\n' +
      'The app password must be for the account that will send the email.'
    );
  }

  const raw = net.connect(PORT, HOST, () => {
    const sock = tls.connect({ socket: raw, servername: HOST, rejectUnauthorized: true }, () => onTls(sock, user, pass));
  });
  raw.setTimeout(20000, () => { console.error('✖ Connection timed out'); process.exit(1); });
  raw.on('error', (err) => fail('SMTP connection error: ' + err.message));

  let buffer = '';
  let step = 'greeting';
  let cmd = '';

  function sendCommand(command) {
    cmd = command;
    console.log('> ' + command.split(/\r?\n/)[0]);
    sock.write(command + '\r\n');
  }

  function onTls(sock, user, pass) {
    sock.setEncoding('utf8');
    sock.on('data', (chunk) => {
      buffer += chunk;
      while (buffer.includes('\r\n')) {
        const idx = buffer.indexOf('\r\n');
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (!line) continue;
        const reply = parseReply(line);
        if (reply.cont) continue; // multiline reply: keep waiting
        handle(reply);
        if (reply.code === 0) fail('Unexpected empty reply');
      }
    });
    sock.on('error', (err) => fail('SMTP error: ' + err.message));
  }

  function handle(reply) {
    if (step === 'greeting') {
      if (reply.code !== 220) fail('Expected 220 greeting, got ' + reply.code);
      sendCommand('EHLO localhost');
      step = 'ehlo';
      return;
    }
    if (step === 'ehlo') {
      if (reply.code !== 250) fail('EHLO failed: ' + reply.code);
      sendCommand('AUTH LOGIN');
      step = 'auth-login';
      return;
    }
    if (step === 'auth-login') {
      if (reply.code !== 334) fail('AUTH LOGIN rejected: ' + reply.code);
      sendCommand(encodeBase64(user));
      step = 'auth-user';
      return;
    }
    if (step === 'auth-user') {
      if (reply.code !== 334) fail('AUTH user rejected: ' + reply.code);
      sendCommand(encodeBase64(pass));
      step = 'auth-pass';
      return;
    }
    if (step === 'auth-pass') {
      if (reply.code !== 235) fail('Authentication failed (235 expected). Check the app password: ' + reply.code + ' ' + reply.text);
      sendCommand('MAIL FROM:<' + user + '>');
      step = 'mail-from';
      return;
    }
    if (step === 'mail-from') {
      if (reply.code !== 250) fail('MAIL FROM failed: ' + reply.code + ' ' + reply.text);
      sendCommand('RCPT TO:<' + TO + '>');
      step = 'rcpt-to';
      return;
    }
    if (step === 'rcpt-to') {
      if (reply.code !== 250) fail('RCPT TO failed: ' + reply.code + ' ' + reply.text);
      sendCommand('DATA');
      step = 'data';
      return;
    }
    if (step === 'data') {
      if (reply.code !== 354) fail('DATA rejected: ' + reply.code + ' ' + reply.text);
      const message =
        'From: ' + user + '\r\n' +
        'To: ' + TO + '\r\n' +
        'Subject: ' + SUBJECT + '\r\n' +
        'Date: ' + new Date().toUTCString() + '\r\n' +
        'Content-Type: text/plain; charset=utf-8\r\n' +
        '\r\n' +
        BODY.replace(/\n/g, '\r\n');
      sendCommand(message.replace(/\r?\n/g, '\r\n').replace(/(^|[^\r])\n/g, '$1\r\n') + '\r\n.');
      step = 'send-done';
      return;
    }
    if (step === 'send-done') {
      if (reply.code !== 250) fail('Message not accepted: ' + reply.code + ' ' + reply.text);
      sendCommand('QUIT');
      step = 'quit';
      return;
    }
    if (step === 'quit') {
      if (reply.code === 221) {
        console.log('✔ Email sent to ' + TO);
        process.exit(0);
      } else {
        fail('QUIT got ' + reply.code);
      }
    }
  }
}

main();
