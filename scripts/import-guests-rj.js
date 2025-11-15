/**
 * Script para importar convidados do evento do Rio de Janeiro
 * Lê o arquivo templates/equinor-rj.csv e gera comandos SQL INSERT
 *
 * Uso: node scripts/import-guests-rj.js
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const CSV_FILE = path.join(__dirname, '../templates/equinor-rj.csv');
const EVENT_ID = 1; // Rio de Janeiro event

function parseCSV(content) {
  const lines = content.split('\n');
  const guests = [];

  // Pular a primeira linha (header) e a última se vazia
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split por ponto-e-vírgula
    const parts = line.split(';');

    if (parts.length < 3) continue;

    const qrcode = parts[0].trim().replace(/^﻿/, ''); // Remove BOM se presente
    const name = parts[1].trim();
    const email = parts[2] ? parts[2].trim().replace(/[";]/g, '') : '';
    const phone = parts.length > 4 ? parts[4].trim().replace(/[";]/g, '') : '';

    // Validar se tem qrcode e nome
    if (qrcode && name && qrcode.match(/^\d+$/)) {
      guests.push({
        qrcode,
        name,
        email: email || null,
        phone: phone || null,
        guid: randomUUID(),
        event_id: EVENT_ID
      });
    }
  }

  return guests;
}

function generateSQL(guests) {
  console.log('-- SQL INSERT para convidados do evento do Rio de Janeiro');
  console.log('-- Total de convidados:', guests.length);
  console.log('-- Evento ID:', EVENT_ID);
  console.log('-- Gerado em:', new Date().toISOString());
  console.log('');
  console.log('-- IMPORTANTE: Execute este script no Supabase SQL Editor');
  console.log('');

  guests.forEach((guest, index) => {
    const email = guest.email ? `'${guest.email.replace(/'/g, "''")}'` : 'NULL';
    const phone = guest.phone ? `'${guest.phone.replace(/'/g, "''")}'` : 'NULL';
    const name = guest.name.replace(/'/g, "''");

    console.log(`INSERT INTO guests (qrcode, name, email, phone, guid, event_id, status) VALUES`);
    console.log(`  ('${guest.qrcode}', '${name}', ${email}, ${phone}, '${guest.guid}', ${guest.event_id}, 'pending');`);
    console.log('');
  });

  console.log('-- Fim do script');
  console.log(`-- Total de INSERTs gerados: ${guests.length}`);
}

function generateJSONOutput(guests) {
  const outputPath = path.join(__dirname, '../output-guests-rj.json');
  fs.writeFileSync(outputPath, JSON.stringify(guests, null, 2), 'utf-8');
  console.log(`\n-- Arquivo JSON gerado: ${outputPath}`);
}

// Main execution
try {
  const content = fs.readFileSync(CSV_FILE, 'utf-8');
  const guests = parseCSV(content);

  if (guests.length === 0) {
    console.error('ERRO: Nenhum convidado encontrado no arquivo CSV');
    process.exit(1);
  }

  generateSQL(guests);
  generateJSONOutput(guests);

} catch (error) {
  console.error('ERRO ao processar arquivo:', error.message);
  process.exit(1);
}
