const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require('node-fetch');

async function main() {
  try {
    const tablePromise = await fetch('https://api.airtable.com/v0/appoztB9WNejYQSsR/config-table?maxRecords=1', {
      method: 'get',
      headers: { Authorization: `Bearer ${core.getInput('airtable-api')}` }
    });

    const data = await tablePromise.json();

    const { records } = data;

    const record = records.find(
      (record) => record.fields.Name === 'canMergeToMain',
    );
  
    const value = record.fields.Value;

    if(!value) {
      core.setFailed("Merges to main is currently blocked. Pls check in General channel for more info!");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();