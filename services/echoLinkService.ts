export class EchoLinkService {
  private static PORT = 5000;
  // Use 127.0.0.1 instead of localhost for better compatibility on Windows/Chrome
  private static BASE_URL = `http://127.0.0.1:${EchoLinkService.PORT}`;

  // The Python Script content that Marco will give to the user
  public static PYTHON_SCRIPT = `
import os
import sys
import platform
import subprocess
import ctypes
import time
from flask import Flask, request, jsonify
from flask_cors import CORS

# Auto-install dependencies logic
try:
    import pyautogui
except ImportError:
    print("Installing dependencies...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyautogui", "flask", "flask-cors"])
    import pyautogui

app = Flask(__name__)
# Enable CORS for all routes to allow browser access
CORS(app, resources={r"/*": {"origins": "*"}})

OS_TYPE = platform.system()

@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "Marco Bridge Active"})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "online", "os": OS_TYPE})

@app.route('/execute', methods=['POST'])
def execute():
    data = request.json
    action = data.get('action')
    value = data.get('value', '')
    
    print(f"[CMD] Action: {action} | Value: {value}")

    try:
        if action == 'lock_pc':
            if OS_TYPE == 'Windows':
                ctypes.windll.user32.LockWorkStation()
            elif OS_TYPE == 'Darwin': # Mac
                subprocess.run('/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession -suspend', shell=True)
            elif OS_TYPE == 'Linux':
                subprocess.run('xdg-screensaver lock', shell=True)
                
        elif action == 'volume_up':
            pyautogui.press('volumeup')
            
        elif action == 'volume_down':
            pyautogui.press('volumedown')
            
        elif action == 'mute':
            pyautogui.press('volumemute')
            
        elif action == 'type_text':
            # Add a small delay to ensure focus
            time.sleep(0.5) 
            pyautogui.write(value, interval=0.05)
            
        elif action == 'open_app':
            if OS_TYPE == 'Windows':
                pyautogui.press('win')
                time.sleep(0.2)
                pyautogui.write(value)
                time.sleep(0.5)
                pyautogui.press('enter')
            elif OS_TYPE == 'Darwin':
                subprocess.Popen(['open', '-a', value])
            elif OS_TYPE == 'Linux':
                subprocess.Popen(value, shell=True)
                
        elif action == 'screenshot':
            path = os.path.join(os.path.expanduser("~"), "Desktop", f"marco_shot_{int(time.time())}.png")
            pyautogui.screenshot(path)
            
        return jsonify({"success": True, "message": f"{action} executed"})
        
    except Exception as e:
        print(f"[ERR] {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    print("---------------------------------------")
    print(f"MARCO ECHO-LINK BRIDGE IS ACTIVE")
    print(f"LISTENING ON: http://127.0.0.1:5000")
    print("---------------------------------------")
    app.run(host='0.0.0.0', port=5000)
`;

  async checkConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout
      
      const res = await fetch(`${EchoLinkService.BASE_URL}/health`, { 
          method: 'GET',
          signal: controller.signal,
          mode: 'cors'
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch (e) {
      // console.warn("EchoLink check failed:", e);
      return false;
    }
  }

  async sendCommand(action: string, value: string = ''): Promise<string> {
    const isConnected = await this.checkConnection();
    if (!isConnected) {
        return "Echo-Link Bridge is OFFLINE. Please run the python script on your PC.";
    }

    try {
      const res = await fetch(`${EchoLinkService.BASE_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
        mode: 'cors'
      });
      
      const data = await res.json();
      if (data.success) return `Echo-Link: ${action} executed successfully.`;
      return `Echo-Link Error: ${data.error}`;
    } catch (e) {
      return "Echo-Link Connection Failed. Ensure Python script is running.";
    }
  }
}