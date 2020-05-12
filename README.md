vault-values
---
Github action parse a mustache.js template using values from a vault secret

# Example Usage

```yaml
jobs:
  parse:
    steps:
    - name: Vault Values
          uses: hexlyOSS/vault-values@v1
          with:
            url: "vault.hexlyoss.io"
            port: "8200"
            secret: "staging/test/"
            token: ${{ secrets.VAULT_TOKEN }}
            renew: true
            template: "./k8s/staging/secret.yaml"
            extras: '{"project": "processor", "lane":"staging", "releaseSha": "abc123"}'
```

# Input Values

### url

**Required** Vault address

### port

**Required** Vault port

### secure

Enable https connection to vault. Default `false`.

### skip-verify

Skip mTLS check when connecting to vault. Default `false`.

### token

Vault token to use.  Default `none`.

### renew

Attempt to renew the token after use. Default `false`.

### secret

**Required** Secret (path) in vault to look for values under.

### template

**Required** Path to template file to parse.

### out

Path to write the parsed output to. Default `<input.template>.parsed`.

### extras

Additional values to be added to the vault values. Default `none`.

## Output

vault-values will parse the provided `template` file with the values from vault secret `secret` and `extras` and write the output to `out`.