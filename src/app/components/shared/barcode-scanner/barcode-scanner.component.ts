import { Component, EventEmitter, Output, Input, OnDestroy, signal, AfterViewInit, Renderer2, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Scanner Toggle Button -->
    <button
      type="button"
      (click)="toggleScanner()"
      class="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-all whitespace-nowrap"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
        ></path>
      </svg>
      <span>📷 Scan</span>
    </button>
  `,
  styles: []
})
export class BarcodeScannerComponent implements OnDestroy, AfterViewInit {
  @Output() scanned = new EventEmitter<string>();
  @Input() autoClose = true;

  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);

  showScanner = signal(false);
  isScanning = signal(false);
  isInitializing = signal(false);
  lastScannedCode = signal<string | null>(null);
  scannerError = signal<string | null>(null);

  private html5QrCode: Html5Qrcode | null = null;
  private currentCameraIndex = 0;
  private cameras: { id: string; label: string }[] = [];
  private modalElement: HTMLElement | null = null;

  ngAfterViewInit() {
    // Pre-fetch available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        this.cameras = devices;
      })
      .catch((err) => {
        console.warn('Could not get cameras:', err);
      });
  }

  ngOnDestroy() {
    this.stopScanner();
    this.removeModal();
  }

  toggleScanner() {
    if (this.showScanner()) {
      this.closeScanner();
    } else {
      this.openScanner();
    }
  }

  async openScanner() {
    this.showScanner.set(true);
    this.isScanning.set(true);
    this.scannerError.set(null);
    this.lastScannedCode.set(null);

    // Create and append modal to body
    this.createModal();

    // Wait for DOM to render
    setTimeout(() => this.startScanner(), 150);
  }

  closeScanner() {
    this.stopScanner();
    this.removeModal();
    this.showScanner.set(false);
    this.isScanning.set(false);
  }

  private createModal() {
    // Remove existing modal if any
    this.removeModal();

    // Create modal container
    this.modalElement = this.renderer.createElement('div');
    this.renderer.setAttribute(this.modalElement, 'id', 'barcode-scanner-modal');
    this.renderer.setStyle(this.modalElement, 'position', 'fixed');
    this.renderer.setStyle(this.modalElement, 'inset', '0');
    this.renderer.setStyle(this.modalElement, 'background', 'rgba(0,0,0,0.85)');
    this.renderer.setStyle(this.modalElement, 'display', 'flex');
    this.renderer.setStyle(this.modalElement, 'alignItems', 'center');
    this.renderer.setStyle(this.modalElement, 'justifyContent', 'center');
    this.renderer.setStyle(this.modalElement, 'padding', '1rem');
    this.renderer.setStyle(this.modalElement, 'zIndex', '99999');

    // Create modal content
    if (!this.modalElement) return;
    this.modalElement.innerHTML = `
      <div style="background: white; border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 24rem; overflow: hidden;">
        <!-- Header -->
        <div style="padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; background: #7c3aed; color: white;">
          <div>
            <h3 style="font-weight: bold; font-size: 1rem; margin: 0;">📷 Scan Barcode</h3>
            <p style="font-size: 0.75rem; color: #c4b5fd; margin: 0;">Point at barcode/QR code</p>
          </div>
          <button id="scanner-close-btn" style="padding: 0.375rem; background: transparent; border: none; color: white; cursor: pointer; border-radius: 9999px;">
            <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Scanner View -->
        <div style="position: relative; background: #111827; min-height: 280px;">
          <div id="barcode-scanner-view" style="width: 100%; min-height: 280px;"></div>
          <div id="scanner-loading" style="position: absolute; inset: 0; background: #111827; display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center; color: white;">
              <div style="width: 2rem; height: 2rem; border: 2px solid transparent; border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 0.5rem;"></div>
              <p style="font-size: 0.875rem; margin: 0;">Starting camera...</p>
            </div>
          </div>
        </div>

        <!-- Result/Error Area -->
        <div id="scanner-result" style="display: none; padding: 0.75rem; background: #f0fdf4; border-top: 1px solid #bbf7d0;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>✅</span>
            <div style="flex: 1; min-width: 0;">
              <p style="font-size: 0.75rem; color: #16a34a; font-weight: 500; margin: 0;">Scanned:</p>
              <p id="scanned-code" style="font-family: monospace; font-weight: bold; color: #166534; font-size: 0.875rem; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></p>
            </div>
          </div>
        </div>

        <div id="scanner-error" style="display: none; padding: 0.75rem; background: #fef2f2; border-top: 1px solid #fecaca;">
          <p id="error-message" style="font-size: 0.875rem; color: #b91c1c; margin: 0;"></p>
        </div>

        <!-- Footer -->
        <div style="padding: 0.75rem; border-top: 1px solid #e5e7eb; background: #f9fafb; display: flex; gap: 0.5rem;">
          <button id="scanner-switch-btn" style="flex: 1; padding: 0.5rem 0.75rem; background: #e5e7eb; border: none; border-radius: 0.5rem; font-weight: 500; font-size: 0.875rem; cursor: pointer;">
            🔄 Switch
          </button>
          <button id="scanner-done-btn" style="flex: 1; padding: 0.5rem 0.75rem; background: #7c3aed; color: white; border: none; border-radius: 0.5rem; font-weight: 500; font-size: 0.875rem; cursor: pointer;">
            Close
          </button>
        </div>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
        #scanner-close-btn:hover, #scanner-done-btn:hover { opacity: 0.9; }
        #scanner-switch-btn:hover { background: #d1d5db; }
        #barcode-scanner-view video { width: 100% !important; height: auto !important; object-fit: cover !important; }
      </style>
    `;

    // Append to body
    this.renderer.appendChild(this.document.body, this.modalElement);

    // Add event listeners
    const closeBtn = this.document.getElementById('scanner-close-btn');
    const doneBtn = this.document.getElementById('scanner-done-btn');
    const switchBtn = this.document.getElementById('scanner-switch-btn');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeScanner());
    if (doneBtn) doneBtn.addEventListener('click', () => this.closeScanner());
    if (switchBtn) switchBtn.addEventListener('click', () => this.switchCamera());
  }

  private removeModal() {
    if (this.modalElement && this.modalElement.parentNode) {
      this.renderer.removeChild(this.document.body, this.modalElement);
      this.modalElement = null;
    }
  }

  private hideLoading() {
    const loadingEl = this.document.getElementById('scanner-loading');
    if (loadingEl) loadingEl.style.display = 'none';
  }

  private showError(message: string) {
    const errorEl = this.document.getElementById('scanner-error');
    const errorMsg = this.document.getElementById('error-message');
    if (errorEl && errorMsg) {
      errorMsg.textContent = message;
      errorEl.style.display = 'block';
    }
    this.hideLoading();
  }

  private showResult(code: string) {
    const resultEl = this.document.getElementById('scanner-result');
    const codeEl = this.document.getElementById('scanned-code');
    if (resultEl && codeEl) {
      codeEl.textContent = code;
      resultEl.style.display = 'block';
    }
  }

  private async startScanner() {
    this.isInitializing.set(true);
    this.scannerError.set(null);

    try {
      // Get available cameras
      this.cameras = await Html5Qrcode.getCameras();

      if (this.cameras.length === 0) {
        this.showError('No camera found. Please ensure camera permissions are granted.');
        this.isInitializing.set(false);
        return;
      }

      // Initialize scanner
      this.html5QrCode = new Html5Qrcode('barcode-scanner-view');

      // Prefer back camera on mobile
      const backCamera = this.cameras.find(
        (c) => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear') || c.label.toLowerCase().includes('environment')
      );

      const cameraId = backCamera?.id || this.cameras[this.currentCameraIndex]?.id;

      await this.html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => this.onScanSuccess(decodedText),
        () => {
          // Ignore scan errors (no code found)
        }
      );

      this.hideLoading();
      this.isInitializing.set(false);
    } catch (err: any) {
      console.error('Scanner error:', err);
      this.isInitializing.set(false);

      if (err.name === 'NotAllowedError') {
        this.showError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        this.showError('No camera found on this device.');
      } else {
        this.showError(`Failed to start scanner: ${err.message || 'Unknown error'}`);
      }
    }
  }

  private async stopScanner() {
    if (this.html5QrCode) {
      try {
        const state = this.html5QrCode.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await this.html5QrCode.stop();
        }
        this.html5QrCode.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      this.html5QrCode = null;
    }
  }

  private onScanSuccess(decodedText: string) {
    // Vibrate on mobile if supported
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    // Play beep sound
    this.playBeep();

    this.lastScannedCode.set(decodedText);
    this.showResult(decodedText);
    this.scanned.emit(decodedText);

    if (this.autoClose) {
      setTimeout(() => this.closeScanner(), 500);
    }
  }

  async switchCamera() {
    if (this.cameras.length <= 1) {
      this.showError('Only one camera available');
      return;
    }

    this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameras.length;

    // Restart scanner with new camera
    await this.stopScanner();
    await this.startScanner();
  }

  private playBeep() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 1000;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 100);
    } catch (e) {
      // Audio not supported
    }
  }
}
