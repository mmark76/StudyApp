'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('stop fails closed and only stops an authorized unchanged listener', { skip: process.platform !== 'win32' }, () => {
  const root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'studyapp-stop-')));
  try {
    const companion = path.join(root, 'local-companion');
    fs.mkdirSync(companion);
    fs.writeFileSync(path.join(companion, 'server.py'), '# fixture');
    const script = path.resolve('local-companion/stop-verified-studyapp-local.ps1');
    const marker = path.join(root, 'stopped.txt');
    const q = s => s.replaceAll("'", "''");
    const scenarios = [
      { name: 'free', expected: '^AVAILABLE', exit: 0 },
      { name: 'other', expected: '^OTHER:other.exe:12345:', exit: 3 },
      { name: 'relative', expected: '^OTHER:python.exe:12345:', exit: 3 },
      { name: 'protected', expected: '^UNVERIFIED:', exit: 2 },
      { name: 'different-user', expected: '^UNVERIFIED:', exit: 2 },
      { name: 'multiple', expected: '^UNVERIFIED', exit: 2 },
      { name: 'reused', expected: '^UNVERIFIED', exit: 2 },
      { name: 'wrong-confirmation', expected: '^UNVERIFIED', exit: 2, confirm: true },
      { name: 'other-changed', expected: '^UNVERIFIED', exit: 2, confirm: true },
      { name: 'other-confirmed', expected: '^STOPPED', exit: 0, confirm: true, stopped: true },
      { name: 'current', expected: '^STOPPED', exit: 0, stopped: true },
    ];
    for (const scenario of scenarios) {
      if (fs.existsSync(marker)) fs.unlinkSync(marker);
      const isOther = ['other', 'protected', 'different-user', 'multiple', 'wrong-confirmation', 'other-changed', 'other-confirmed'].includes(scenario.name);
      const name = scenario.name === 'protected' ? 'explorer.exe' : isOther ? 'other.exe' : 'python.exe';
      const command = scenario.name === 'relative' ? 'python.exe local-companion\\server.py' : isOther ? 'C:\\Apps\\other.exe' : `"C:\\Python\\python.exe" "${path.join(companion, 'server.py')}"`;
      const code = [
        '$global:listenerCalls=0; $global:ownerCalls=0; $created=[datetime]"2026-01-01T00:00:00"',
        `$scenario='${scenario.name}'`,
        `function Get-NetTCPConnection { [CmdletBinding()] param($State) $global:listenerCalls++; if ($scenario -ne 'free' -and ($global:listenerCalls -lt 3 -or $scenario -notin @('current','other-confirmed'))) { [pscustomobject]@{ LocalAddress='127.0.0.1'; LocalPort=8767; OwningProcess=12345 }; if ($scenario -eq 'multiple') { [pscustomobject]@{ LocalAddress='::1'; LocalPort=8767; OwningProcess=12346 } } } }`,
        `function Get-CimInstance { [CmdletBinding()] param($ClassName,$Filter) $global:ownerCalls++; $date=if ($scenario -in @('reused','other-changed') -and $global:ownerCalls -gt 1) { $created.AddSeconds(1) } else { $created }; [pscustomobject]@{ Name='${name}'; CommandLine='${q(command)}'; ExecutablePath='C:\\Apps\\${name}'; CreationDate=$date } }`,
        `function Invoke-CimMethod { [CmdletBinding()] param($InputObject,$MethodName) $parts=[Security.Principal.WindowsIdentity]::GetCurrent().Name.Split('\\',2); if ($scenario -eq 'different-user') { [pscustomobject]@{ReturnValue=0;Domain='other';User='other'} } else { [pscustomobject]@{ReturnValue=0;Domain=$parts[0];User=$parts[1]} } }`,
        `function Stop-Process { [CmdletBinding()] param($Id) [IO.File]::WriteAllText('${q(marker)}',[string]$Id) }`,
        `& '${q(script)}' -LabRoot '${q(root)}' ${scenario.confirm ? `-OtherPid ${scenario.name === 'wrong-confirmation' ? 12346 : 12345} -OtherCreationTicks $created.Ticks` : ''}; exit $LASTEXITCODE`,
      ].join('; ');
      const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', Buffer.from(code, 'utf16le').toString('base64')], { encoding: 'utf8', timeout: 15000 });
      assert.equal(result.status, scenario.exit, `${scenario.name}: ${result.stdout} ${result.stderr}`);
      assert.match(result.stdout, new RegExp(scenario.expected));
      assert.equal(fs.existsSync(marker), Boolean(scenario.stopped), scenario.name);
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
