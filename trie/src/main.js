const express = require('express')
const RT = require('./RecipeTrie')
const { Client } = require('pg')

const client = new Client();

const Trie = new RT();

client.connect(err => {
  if (err) {
    console.error('unable to connect to Postgres', err.stack);
  } else {
    console.log('connected to Postgres')
  }
})

