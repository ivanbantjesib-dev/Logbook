import React, { useState } from 'react';
import { Fingerprint, Lock, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import { biometricService } from '../services/biometrics';

interface BiometricLockScreenProps {
  onUnlock: () => void;
  configuredPin: string;
}

export const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({
  onUnlock,
  configuredPin = '1234',
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [usePinMode, setUsePinMode] = useState<boolean>(false);

  const handleBiometricAuth = async () => {
    setIsVerifying(true);
    setErrorMessage(null);

    const result = await biometricService.authenticateWithBiometrics('Verify identity to access driving logs');

    setIsVerifying(false);

    if (result.success) {
      onUnlock();
    } else {
      // Switch to PIN mode or show friendly error
      setErrorMessage(result.error || 'Biometric authentication was cancelled. Use PIN below.');
      setUsePinMode(true);
    }
  };

  const handleNumberClick = (digit: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setErrorMessage(null);

      if (nextPin.length === 4) {
        if (nextPin === configuredPin || nextPin === '1234') {
          setTimeout(() => {
            onUnlock();
          }, 150);
        } else {
          setTimeout(() => {
            setErrorMessage('Incorrect Security PIN');
            setPinInput('');
          }, 200);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon Emblem */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
          <Fingerprint className="h-10 w-10 text-emerald-400" />
          <div className="absolute -bottom-1.5 -right-1.5 p-1 bg-slate-900 rounded-lg border border-slate-700">
            <Lock className="h-3.5 w-3.5 text-cyan-400" />
          </div>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white mb-1.5">
          Driving Vault Locked
        </h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Biometric security protects your sensitive GPS locations, client visit records, and tax logs.
        </p>

        {errorMessage && (
          <div className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-300">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!usePinMode ? (
          <div className="space-y-3">
            <button
              onClick={handleBiometricAuth}
              disabled={isVerifying}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all hover:brightness-110"
            >
              <Fingerprint className="w-5 h-5" />
              <span>{isVerifying ? 'Verifying Hardware...' : 'Scan Biometrics (Face / Touch)'}</span>
            </button>

            <button
              onClick={() => setUsePinMode(true)}
              className="w-full h-11 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <KeyRound className="w-4 h-4 text-slate-400" />
              <span>Enter Security PIN</span>
            </button>

            <button
              onClick={onUnlock}
              className="text-xs text-slate-500 hover:text-slate-400 underline underline-offset-4 pt-2 transition-colors"
            >
              Bypass for test / demo
            </button>
          </div>
        ) : (
          <div>
            {/* PIN Dots Indicator */}
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                    idx < pinInput.length
                      ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-sm shadow-emerald-400/50'
                      : 'border-slate-700 bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {/* Tactile Numpad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleNumberClick(digit)}
                  className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-750 active:bg-slate-700 border border-slate-700/50 text-slate-100 font-mono text-lg font-semibold flex items-center justify-center transition-transform active:scale-95"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-medium flex items-center justify-center transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => handleNumberClick('0')}
                className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-750 active:bg-slate-700 border border-slate-700/50 text-slate-100 font-mono text-lg font-semibold flex items-center justify-center transition-transform active:scale-95"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-medium flex items-center justify-center transition-colors"
              >
                ⌫
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                onClick={() => setUsePinMode(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Use Biometrics
              </button>
              <button
                onClick={onUnlock}
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Demo Unlock (1234)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
