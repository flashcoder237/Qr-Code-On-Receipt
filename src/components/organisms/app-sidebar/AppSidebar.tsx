// src/components/organisms/app-sidebar/AppSidebar.tsx - Added unlock code prompt on app start

import React, { useState, useEffect } from "react";

const AppSidebar: React.FC = () => {
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(true);
  const [unlockCodeInput, setUnlockCodeInput] = useState("");
  const [unlockCodeError, setUnlockCodeError] = useState("");

  // Check unlock code on submit
  const validateUnlockCode = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0,10).replace(/-/g, '');
    const expectedCode = `Erica2004.-${dateStr}`;
    if (unlockCodeInput === expectedCode) {
      setShowUnlockPrompt(false);
      setUnlockCodeInput("");
      setUnlockCodeError("");
    } else {
      setUnlockCodeError("Code de déverrouillage invalide");
    }
  };

  // Render unlock code prompt modal
  if (showUnlockPrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg w-80">
          <h3 className="text-lg font-semibold mb-4">Code de déverrouillage requis</h3>
          <input
            type="password"
            className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
            value={unlockCodeInput}
            onChange={(e) => setUnlockCodeInput(e.target.value)}
            autoFocus
          />
          {unlockCodeError && <p className="text-red-600 mb-2">{unlockCodeError}</p>}
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-300 rounded"
              onClick={() => {
                setUnlockCodeInput("");
                setUnlockCodeError("");
              }}
            >
              Annuler
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={validateUnlockCode}
            >
              Valider
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the rest of the sidebar or app content here
  return (
    <div>
      {/* Sidebar content here */}
      <p>App Sidebar Content</p>
    </div>
  );
};

export default AppSidebar;
