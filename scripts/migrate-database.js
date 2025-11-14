/**
 * Script para executar a migração do banco de dados
 * Execute com: node scripts/migrate-database.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hrucovxpenekzmxbatww.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhydWNvdnhwZW5la3pteGJhdHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5ODYxNzEsImV4cCI6MjA3NzU2MjE3MX0.fLshLt6eNe7W29ubSgf-o3kaIMGIumf6OIogX6Kvg4o'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkConnection() {
  console.log('🔗 Verificando conexão com Supabase...')
  try {
    const { data, error } = await supabase.from('guests').select('count', { count: 'exact', head: true })
    if (error) {
      console.log('⚠️  Tabela guests ainda não existe (normal se for primeira execução)')
      return true
    }
    console.log('✅ Conexão estabelecida com sucesso!')
    return true
  } catch (err) {
    console.error('❌ Erro ao conectar:', err.message)
    return false
  }
}

async function insertEvents() {
  console.log('\n📅 Inserindo eventos...')

  const events = [
    {
      name: 'Festa de Confraternização RJ 2024',
      slug: 'festa-confraternizacao-rj-2024',
      description: 'Festa de fim de ano da Equinor no Rio de Janeiro',
      event_date: '2024-12-20T19:00:00-03:00',
      location: 'Rio de Janeiro',
      template_name: 'equinor-convite-RJ',
      primary_color: '#FF1243',
      secondary_color: '#243746',
      background_style: 'gradient',
      welcome_message: 'Você foi convidado!',
      event_details: 'Festa de Confraternização 2024 - Rio de Janeiro. Este convite é pessoal e intransferível.',
      show_qr_code: true,
      show_event_details: true,
      is_active: true
    },
    {
      name: 'Festa de Confraternização SP 2024',
      slug: 'festa-confraternizacao-sp-2024',
      description: 'Festa de fim de ano da Equinor em São Paulo',
      event_date: '2024-12-22T19:00:00-03:00',
      location: 'São Paulo',
      template_name: 'equinor-convite-SP',
      primary_color: '#FF1243',
      secondary_color: '#243746',
      background_style: 'gradient',
      welcome_message: 'Você foi convidado!',
      event_details: 'Festa de Confraternização 2024 - São Paulo. Este convite é pessoal e intransferível.',
      show_qr_code: true,
      show_event_details: true,
      is_active: true
    }
  ]

  for (const event of events) {
    const { data, error } = await supabase
      .from('events')
      .upsert(event, { onConflict: 'slug' })
      .select()

    if (error) {
      console.error(`  ❌ Erro ao inserir evento "${event.name}":`, error.message)
    } else {
      console.log(`  ✅ Evento cadastrado: ${event.name}`)
    }
  }
}

async function linkGuestsToEvents() {
  console.log('\n🔗 Vinculando convidados aos eventos...')

  // Buscar todos os eventos
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name')

  if (eventsError) {
    console.error('❌ Erro ao buscar eventos:', eventsError.message)
    return
  }

  // Para cada evento, vincular os convidados
  for (const event of events) {
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('id, name, social_event')
      .eq('social_event', event.name)
      .is('event_id', null)

    if (guestsError) {
      console.error(`  ❌ Erro ao buscar convidados do evento "${event.name}":`, guestsError.message)
      continue
    }

    if (!guests || guests.length === 0) {
      console.log(`  ℹ️  Nenhum convidado encontrado para "${event.name}"`)
      continue
    }

    // Atualizar event_id dos convidados
    for (const guest of guests) {
      const { error: updateError } = await supabase
        .from('guests')
        .update({ event_id: event.id })
        .eq('id', guest.id)

      if (updateError) {
        console.error(`    ❌ Erro ao vincular ${guest.name}:`, updateError.message)
      }
    }

    console.log(`  ✅ ${guests.length} convidado(s) vinculado(s) ao evento "${event.name}"`)
  }
}

async function verifySetup() {
  console.log('\n🔍 Verificando configuração...')

  // Verificar eventos
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name, slug, template_name')
    .order('created_at', { ascending: false })

  if (eventsError) {
    console.error('❌ Erro ao verificar eventos:', eventsError.message)
  } else {
    console.log(`\n✅ ${events.length} evento(s) cadastrado(s):`)
    events.forEach(event => {
      console.log(`   - ${event.name} (${event.slug}) → Template: ${event.template_name}`)
    })
  }

  // Verificar convidados
  const { data: guests, error: guestsError, count } = await supabase
    .from('guests')
    .select('id, name, event_id', { count: 'exact' })
    .not('event_id', 'is', null)

  if (guestsError) {
    console.error('❌ Erro ao verificar convidados:', guestsError.message)
  } else {
    console.log(`\n✅ ${count} convidado(s) vinculado(s) a eventos`)

    // Contar convidados sem evento
    const { count: withoutEvent } = await supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .is('event_id', null)

    if (withoutEvent > 0) {
      console.log(`⚠️  ${withoutEvent} convidado(s) sem evento vinculado`)
    }
  }
}

async function main() {
  console.log('🚀 Iniciando migração do banco de dados...\n')
  console.log('=' .repeat(60))

  // 1. Verificar conexão
  const connected = await checkConnection()
  if (!connected) {
    console.error('\n❌ Não foi possível conectar ao Supabase. Verifique as credenciais.')
    process.exit(1)
  }

  // 2. Inserir eventos
  await insertEvents()

  // 3. Vincular convidados aos eventos
  await linkGuestsToEvents()

  // 4. Verificar configuração
  await verifySetup()

  console.log('\n' + '='.repeat(60))
  console.log('✅ Migração concluída com sucesso!')
  console.log('\n📝 IMPORTANTE: Você ainda precisa executar o SQL no Supabase SQL Editor:')
  console.log('   1. Acesse: https://hrucovxpenekzmxbatww.supabase.co/project/hrucovxpenekzmxbatww/sql')
  console.log('   2. Cole o conteúdo do arquivo supabase-schema.sql')
  console.log('   3. Clique em Run\n')
}

// Executar
main().catch(err => {
  console.error('\n❌ Erro na migração:', err)
  process.exit(1)
})
