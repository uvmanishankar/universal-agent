const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Detect the currently active application window.
 * Falls back gracefully on each platform.
 * @returns {{ app: string, title: string, timestamp: number }}
 */
async function getActiveWindow() {
  const ts = Date.now();

  try {
    if (process.platform === 'win32') return await getWindowsActiveWindow(ts);
    if (process.platform === 'darwin') return await getMacActiveWindow(ts);
    return await getLinuxActiveWindow(ts);
  } catch {
    return { app: 'Unknown', title: 'Unknown', timestamp: ts };
  }
}

async function getWindowsActiveWindow(ts) {
  const script = `
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    using System.Text;
    public class WinInfo {
      [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
      [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
      [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    }
"@
    $hwnd = [WinInfo]::GetForegroundWindow()
    $sb = New-Object System.Text.StringBuilder 256
    [WinInfo]::GetWindowText($hwnd, $sb, 256) | Out-Null
    $pid = 0
    [WinInfo]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    "$($proc.ProcessName)|$($sb.ToString())"
  `;
  const { stdout } = await execAsync(`powershell -Command "${script.replace(/\n/g, ' ')}"`);
  const [appName, ...titleParts] = stdout.trim().split('|');
  return { app: appName || 'Unknown', title: titleParts.join('|') || 'Unknown', timestamp: ts };
}

async function getMacActiveWindow(ts) {
  const script = `
    tell application "System Events"
      set frontApp to name of first application process whose frontmost is true
      set frontTitle to ""
      try
        set frontTitle to name of front window of application process frontApp
      end try
      return frontApp & "|" & frontTitle
    end tell
  `;
  const { stdout } = await execAsync(`osascript -e '${script}'`);
  const [appName, title] = stdout.trim().split('|');
  return { app: appName || 'Unknown', title: title || 'Unknown', timestamp: ts };
}

async function getLinuxActiveWindow(ts) {
  try {
    const { stdout: winId } = await execAsync('xdotool getactivewindow');
    const id = winId.trim();
    const { stdout: title } = await execAsync(`xdotool getwindowname ${id}`);
    const { stdout: pid } = await execAsync(`xdotool getwindowpid ${id}`);
    const { stdout: procName } = await execAsync(`cat /proc/${pid.trim()}/comm`);
    return { app: procName.trim(), title: title.trim(), timestamp: ts };
  } catch {
    // fallback: wmctrl
    const { stdout } = await execAsync('wmctrl -l -p');
    const lines = stdout.split('\n');
    return { app: lines[0]?.split(/\s+/)[3] || 'Unknown', title: lines[0] || 'Unknown', timestamp: ts };
  }
}

module.exports = { getActiveWindow };
