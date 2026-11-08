[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$ProtocolUrl
)

$ErrorActionPreference = "Stop"

function Show-LauncherError([string]$Message) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show($Message, "StudyApp Local", "OK", "Error") | Out-Null
}

function Test-StudyAppLocalListener {
    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $attempt = $client.BeginConnect("127.0.0.1", 8767, $null, $null)
        if (-not $attempt.AsyncWaitHandle.WaitOne(500)) {
            return $false
        }
        $client.EndConnect($attempt)
        return $true
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

try {
    $uri = [Uri]$ProtocolUrl
    if ($uri.Scheme -ne "studyapp-local" -or $uri.Host -notin @("open", "stop") -or $uri.UserInfo -or $uri.Port -ne -1 -or $uri.AbsolutePath -notin @("", "/") -or $uri.Query -or $uri.Fragment) {
        throw "StudyApp Local rejected an unrecognised launcher request."
    }

    $root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
    if ($uri.Host -eq "stop") {
        $safeStop = Join-Path $PSScriptRoot "stop-verified-studyapp-local.ps1"
        if (-not (Test-Path -LiteralPath $safeStop -PathType Leaf)) { throw "The StudyApp Local package is incomplete. Extract the complete package and install the launcher again." }
        Add-Type -AssemblyName PresentationFramework
        $choice = [System.Windows.MessageBox]::Show(
            "Stop StudyApp Local? Any active work may be interrupted.`r`n`r`nΝα σταματήσει το StudyApp Local; Μια ενεργή εργασία μπορεί να διακοπεί.",
            "StudyApp Local", [System.Windows.MessageBoxButton]::YesNo,
            [System.Windows.MessageBoxImage]::Warning, [System.Windows.MessageBoxResult]::No
        )
        if ($choice -ne [System.Windows.MessageBoxResult]::Yes) { exit 0 }
        $result = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $safeStop -LabRoot $root
        $other = @($result | Where-Object { $_ -match '^OTHER:[\w. -]{1,100}:\d{1,10}:\d{1,19}$' } | Select-Object -First 1)
        if ($LASTEXITCODE -eq 3 -and $other.Count -eq 1) {
            $parts = $other[0].Split(':')
            $name = $parts[1]; $otherPid = [int]$parts[2]; $otherTicks = [long]$parts[3]
            $confirmOther = [System.Windows.MessageBox]::Show(
                "Port 8767 is used by $name (PID $otherPid), which may be running in the background. Close this application? The whole process will close, including any other tasks it runs. Unsaved work may be lost.`r`n`r`nΗ θύρα 8767 χρησιμοποιείται από το $name (PID $otherPid), που μπορεί να εκτελείται στο παρασκήνιο. Να κλείσει αυτή η εφαρμογή; Θα κλείσει ολόκληρη η διεργασία, μαζί με άλλες εργασίες της. Μη αποθηκευμένη εργασία μπορεί να χαθεί.",
                "StudyApp Local", [System.Windows.MessageBoxButton]::YesNo,
                [System.Windows.MessageBoxImage]::Warning, [System.Windows.MessageBoxResult]::No
            )
            if ($confirmOther -ne [System.Windows.MessageBoxResult]::Yes) { exit 0 }
            $result = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $safeStop -LabRoot $root -OtherPid $otherPid -OtherCreationTicks $otherTicks
        }
        if ($LASTEXITCODE -ne 0 -and $result -contains 'STOPPED_PORT_BUSY') {
            throw "The selected application was stopped, but port 8767 is still in use or could not be verified. StudyApp Local cannot start until it is available.`r`n`r`nΗ επιλεγμένη εφαρμογή σταμάτησε, αλλά η θύρα 8767 εξακολουθεί να χρησιμοποιείται ή δεν ήταν δυνατός ο έλεγχός της. Το StudyApp Local δεν μπορεί να ξεκινήσει μέχρι να είναι διαθέσιμη."
        }
        if ($LASTEXITCODE -eq 0 -and $result -contains 'STOPPED') {
            [System.Windows.MessageBox]::Show("The selected application stopped and port 8767 is available.`r`n`r`nΗ επιλεγμένη εφαρμογή σταμάτησε και η θύρα 8767 είναι διαθέσιμη.", "StudyApp Local", "OK", "Information") | Out-Null
            exit 0
        }
        if ($LASTEXITCODE -eq 0 -and $result -contains 'AVAILABLE') {
            [System.Windows.MessageBox]::Show("Port 8767 is available. You can start StudyApp Local.`r`n`r`nΗ θύρα 8767 είναι διαθέσιμη. Μπορείτε να ξεκινήσετε το StudyApp Local.", "StudyApp Local", "OK", "Information") | Out-Null
            exit 0
        }
        $ownerName = @($result | Where-Object { $_ -match '^UNVERIFIED:[\w. -]{1,100}$' } | Select-Object -First 1)
        $detail = if ($ownerName.Count -gt 0) { "`r`nProcess / Διεργασία: $($ownerName[0].Substring(11))" } else { "" }
        throw "Port 8767 is in use or could not be checked safely. StudyApp Local cannot start until it is available. No unverified application was stopped.$detail`r`n`r`nEven if all windows are closed, an application may still be running in the background. Find the process in Windows Task Manager and close it only if you recognize it, then try again. An older StudyApp Local server may need to be closed from its own window.`r`n`r`nΗ θύρα 8767 χρησιμοποιείται ή δεν ήταν δυνατός ο ασφαλής έλεγχός της. Το StudyApp Local δεν μπορεί να ξεκινήσει μέχρι να είναι διαθέσιμη. Καμία μη επιβεβαιωμένη εφαρμογή δεν σταμάτησε.`r`n`r`nΑκόμη κι αν όλα τα παράθυρα είναι κλειστά, μια εφαρμογή μπορεί να παραμένει ενεργή στο παρασκήνιο. Βρείτε τη διεργασία στη Διαχείριση Εργασιών των Windows και κλείστε τη μόνο αν την αναγνωρίζετε. Ένα παλαιότερο StudyApp Local ίσως χρειάζεται να κλείσει από το δικό του παράθυρο."
    }
    $startScript = Join-Path $root "Start StudyApp Local.bat"
    $stopScript = Join-Path $PSScriptRoot "stop-studyapp-local.ps1"
    if (-not (Test-Path -LiteralPath $startScript -PathType Leaf) -or -not (Test-Path -LiteralPath $stopScript -PathType Leaf)) {
        throw "The StudyApp Local package is incomplete. Extract the complete package and install the launcher again."
    }

    & $stopScript -Port 8767 -QuietIfNotRunning
    if ($LASTEXITCODE -ne 0) {
        throw "StudyApp Local cannot start because port 8767 is in use or could not be checked safely. No other application was stopped.`r`n`r`nIf another application is using this port, close it and try again. If an earlier StudyApp Local is running, close its window or run Stop StudyApp Local Server.bat.`r`n`r`nΤο StudyApp Local δεν μπορεί να ξεκινήσει επειδή η θύρα 8767 χρησιμοποιείται ή δεν ήταν δυνατός ο ασφαλής έλεγχός της. Καμία άλλη εφαρμογή δεν σταμάτησε.`r`n`r`nΑν η θύρα χρησιμοποιείται από άλλη εφαρμογή, κλείστε την και δοκιμάστε ξανά. Αν είναι παλαιότερο StudyApp Local, κλείστε το παράθυρό του ή εκτελέστε το Stop StudyApp Local Server.bat."
    }

    $previousSuppressBrowser = $env:STUDYAPP_LOCAL_SUPPRESS_BROWSER
    $env:STUDYAPP_LOCAL_SUPPRESS_BROWSER = "1"
    try {
        # The server runs in this window. Keep it visible so users can see startup
        # errors and know that closing the window stops StudyApp Local.
        Start-Process -FilePath $startScript -WorkingDirectory $root -WindowStyle Normal
    } finally {
        if ($null -eq $previousSuppressBrowser) {
            Remove-Item Env:STUDYAPP_LOCAL_SUPPRESS_BROWSER -ErrorAction SilentlyContinue
        } else {
            $env:STUDYAPP_LOCAL_SUPPRESS_BROWSER = $previousSuppressBrowser
        }
    }

    $deadline = (Get-Date).AddSeconds(45)
    while ((Get-Date) -lt $deadline) {
        if (Test-StudyAppLocalListener) {
            Start-Process "http://127.0.0.1:8767/#/workspace-beta"
            exit 0
        }
        Start-Sleep -Milliseconds 500
    }

    throw "StudyApp Local did not start within 45 seconds. Run Start StudyApp Local.bat directly to see the startup message."
} catch {
    Show-LauncherError $_.Exception.Message
    exit 1
}
