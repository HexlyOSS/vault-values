const Mustache = require('mustache');
const fs = require('fs').promises;
const core = require('@actions/core');

async function parseTemplate () {
  const vaultUrl = core.getInput('url', { required: true });
  const vaultport = core.getInput('port', { required: true });
  const vaultSecure = core.getInput('secure', { required: false });
  const vaultToken = core.getInput('token', { required: false });
  const vaultTokenRenew = core.getInput('renew', { requied: false });
  const vaultSecret = core.getInput('secret', { required: true });
  const vaultSkipVerify = core.getInput('skip-verify', { required: false });

  const valuesExtras = core.getInput('extras', { requried: false });

  const templateFile = core.getInput('template', { required: true });
  try {
    await fs.stat(templateFile)
  } catch (e) {
    console.log(e)
    throw e;
  }

  let templateOut;
  const outFile = core.getInput('out', { required: false });
  if (outFile.length === 0) {
    templateOut = templateFile + '.parsed';
  } else {
    templateOut = outFile;
  }

  console.log('connecting to vault');

  if (vaultSkipVerify) {
    process.env.VAULT_SKIP_VERIFY = 'true';
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
  } catch (e) {
    console.log(e);
    throw e;
  }

  let parsed;

  try {
    console.log('Parsing file ' + templateFile);
    const data = await fs.readFile(templateFile, 'utf-8');
    const p = Mustache.render(data, values);
    parsed = p;
  } catch (e) {
    console.log(e);
    throw e;
  }

  try {
    console.log('Writing output file ' + templateOut)
    await fs.writeFile(templateOut, parsed)
  } catch (e) {
    console.log(e);
    throw e
  }

  if (vaultTokenRenew) {
    try {
      console.log('Renewing Token');
      await vault.tokenRenewSelf()
    } catch (e) {
      console.log(e);
      throw e
    }
  }
};

module.exports = { parseTemplate };
