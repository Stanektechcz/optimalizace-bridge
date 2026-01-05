import React from 'react';

/**
 * ChartDisplayControls - kontrolní panel pro zobrazení grafů
 * Přesně podle Python implementace z libs/funsChart.py:
 * - CheckButtons pro viditelnost čar (Spotřeba, Výroba, Baterie, Suma, Cena)
 * - CheckButton "Invertovat výrobu" (pvi=-PVkWh vs pvr=PVkWh)
 * - RadioButtons "Suma zahrnuje" (Všechno, Spotřeba a výroba, Spotřeba a baterie, Výroba a baterie)
 * - RadioButtons "Graf baterie" (Odběr / Dodávka, Energie v baterii)
 */
const ChartDisplayControls = ({
  // Visibility checkboxes
  visibleLines = {},
  onToggleLine,
  
  // Invert production checkbox
  invertProduction = false,
  onToggleInvertProduction,
  
  // Sum mode radio
  sumMode = 'all', // 'all', 'consAndProd', 'consAndBatt', 'prodAndBatt'
  onChangeSumMode,
  
  // Battery mode radio
  batteryMode = 'flow', // 'flow', 'energy'
  onChangeBatteryMode,
  
  // Optional: hide certain controls
  showInvertProduction = true,
  showSumModes = true,
  showBatteryModes = false,
}) => {
  
  const sumModes = [
    { value: 'all', label: 'Všechno' },
    { value: 'consAndProd', label: 'Spotřeba a výroba' },
    { value: 'consAndBatt', label: 'Spotřeba a baterie' },
    { value: 'prodAndBatt', label: 'Výroba a baterie' },
  ];
  
  const batteryModes = [
    { value: 'flow', label: 'Odběr / Dodávka' },
    { value: 'energy', label: 'Energie v baterii' },
  ];
  
  return (
    <div className="chart-display-controls" style={{
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '16px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '24px',
      fontSize: '14px',
    }}>
      
      {/* Visibility Checkboxes - podle CheckButtons z Python */}
      <div style={{ flex: '1 1 200px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
          Zobrazit:
        </h4>
        {Object.entries(visibleLines).map(([key, visible]) => (
          <div key={key} style={{ marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={visible}
                onChange={() => onToggleLine(key)}
                style={{ marginRight: '8px' }}
              />
              <span>{getLabelForKey(key)}</span>
            </label>
          </div>
        ))}
      </div>
      
      {/* Invert Production Checkbox - podle CheckButton 'Invertovat výrobu' */}
      {showInvertProduction && (
        <div style={{ flex: '1 1 200px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
            &nbsp;
          </h4>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={invertProduction}
                onChange={onToggleInvertProduction}
                style={{ marginRight: '8px' }}
              />
              <span>Invertovat výrobu</span>
            </label>
          </div>
        </div>
      )}
      
      {/* Sum Mode Radio Buttons - podle RadioButtons 'Suma zahrnuje' */}
      {showSumModes && (
        <div style={{ flex: '1 1 200px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
            Suma zahrnuje:
          </h4>
          {sumModes.map((mode) => (
            <div key={mode.value} style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="sumMode"
                  value={mode.value}
                  checked={sumMode === mode.value}
                  onChange={() => onChangeSumMode(mode.value)}
                  style={{ marginRight: '8px' }}
                />
                <span>{mode.label}</span>
              </label>
            </div>
          ))}
        </div>
      )}
      
      {/* Battery Mode Radio Buttons - podle RadioButtons 'Graf baterie' */}
      {showBatteryModes && (
        <div style={{ flex: '1 1 200px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
            Graf baterie:
          </h4>
          {batteryModes.map((mode) => (
            <div key={mode.value} style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="batteryMode"
                  value={mode.value}
                  checked={batteryMode === mode.value}
                  onChange={() => onChangeBatteryMode(mode.value)}
                  style={{ marginRight: '8px' }}
                />
                <span>{mode.label}</span>
              </label>
            </div>
          ))}
        </div>
      )}
      
    </div>
  );
};

// Helper funkce pro překlad klíčů na české názvy
const getLabelForKey = (key) => {
  const labels = {
    consumption: 'Spotřeba',
    production: 'Výroba',
    battery: 'Baterie',
    sum: 'Suma',
    price: 'Cena',
  };
  return labels[key] || key;
};

export default ChartDisplayControls;
