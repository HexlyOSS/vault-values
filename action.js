import { getInput } from '@actions/core';
import { render } from 'mustache';
import { promises as fs } from 'fs';

async function parseTemplate(){
  const vaultUrl = getInput('url', { required: true });
  const vaultport = getInput('port', { required: true });
  const vaultSecure = getInput('secure', { required: false });
  const vaultToken = getInput('token', { required: false });
  const vaultTokenRenew = getInput('renew', { requied: false });
  const vaultSecret = getInput('secret', { required: true });
  const vaultSkipVerify = getInput('skip-verify', { required: false});

  const valuesExtras = getInput('extras', { requried: false });

  const templateFile = getInput('template', { required: true });
  try {
    await fs.stat(templateFile)
  } catch(e) {
    console.log(e)
    throw e;
  }

  let templateOut;
  const outFile = getInput('out', { required: false });
  if (outFile.length == 0){
    templateOut = templateFile + '.parsed';
  } else {
    templateOut = outFile;
  }

  console.log("connecting to vault");
  
  if (vaultSkipVerify) {
    process.env.VAULT_SKIP_VERIFY = "true";
  }

  const vault = require('node-vault')({
    token: vaultToken,
    endpoint: `${vaultSecure ? 'https://' : 'http://'}${vaultUrl}:${vaultport}`
  });

  let values
  try {
    const parsed = valuesExtras ? JSON.parse(valuesExtras) : {};
    values = parsed
  } catch (e) {
    console.log(e);
    throw e;
  }

  try {
    console.log(`getting secret values from vault at path ${vaultSecret}`);
    const keyList = await vault.list(vaultSecret);
    for (const key of keyList.data.keys) {
      const keyValue = await vault.read(`${vaultSecret}/${key}`);
      values[key] = Buffer.from(keyValue.data.value).toString('base64');
    }
  } catch(e) {
    console.log(e);
    throw e;
  }

  let parsed;

  try {
    console.log("Parsing file " + templateFile);
    const data = await fs.readFile(templateFile, 'utf-8');
    const p = render(data, values);
    parsed = p;
  } catch (e) {
    console.log(e);
    throw e;
  }

  try {
    console.log("Writing output file " + templateOut)
    await fs.writeFile(templateOut, parsed)
  } catch (e) {
    console.log(e);
    throw e
  }

  if (vaultTokenRenew) {
    try {
      console.log("Renewing Token");
      await vault.tokenRenewSelf()
    } catch (e) {
      console.log(e);
      throw e
    }
  }
};

export default {parseTemplate};