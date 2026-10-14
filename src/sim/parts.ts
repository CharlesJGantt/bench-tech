/**
 * Parts catalog. All part numbers and brand names are fictional.
 */

export type Kind =
  | 'resistor'
  | 'capacitor'
  | 'electrolytic'
  | 'fuse'
  | 'diode'
  | 'tvs'
  | 'zener'
  | 'led'
  | 'cob'
  | 'nmos'
  | 'pmos'
  | 'inductor'
  | 'buck'
  | 'ldo'
  | 'mcu'
  | 'charger'
  | 'retimer'
  | 'amp'
  | 'boost'
  | 'shifter'
  | 'jack'
  | 'connector'
  | 'battery'
  | 'module'
  | 'button'
  | 'testpoint'
  | 'logic'
  | 'stick';

export type Pkg =
  | '0603'
  | '1206'
  | 'SMA'
  | 'SOD123'
  | 'LED0805'
  | 'SOT23'
  | 'SOT23-6'
  | 'SOT223'
  | 'SOIC8'
  | 'QFP16'
  | 'DPAK'
  | 'CAP_EL'
  | 'CAP_EL10'
  | 'IND5'
  | 'BARREL'
  | 'USBC'
  | 'MUSB'
  | 'HDMI'
  | 'PWR2'
  | 'JST2'
  | 'FPC2'
  | 'TACT6'
  | 'COB'
  | 'BATT'
  | 'SCREEN'
  | 'SPK'
  | 'LEDBAR'
  | 'TP'
  | 'TO220'
  | 'DIP40'
  | 'DIP28'
  | 'DIP16'
  | 'DIP14'
  | 'COIN'
  | 'EDGE6'
  | 'CARTSLOT6'
  | 'RFMOD'
  | 'RCA2'
  | 'HDR3'
  | 'STICK'
  | 'SPRING2'
  | 'AA2'
  | 'SCREEN_S'
  | 'FPC3'
  | 'SLIDE'
  | 'PAK'
  | 'TPAD'
  | 'FPC4'
  | 'SCREEN_M'
  | 'SCREEN_L'
  | 'SCREEN_W'
  | 'TFSLOT';

export interface PartSpec {
  partNo: string;
  kind: Kind;
  pkg: Pkg;
  /** Primary value in base units (Ω, F, A, V...). */
  value: number;
  /** Human-readable value, e.g. "10k", "22µF 10V". */
  label: string;
  /** Text printed on the part body (what a magnifier shows). */
  marking: string;
  /** Voltage rating (capacitors) or fuse current rating. */
  rating?: number;
  /** LED colour or diode type detail. */
  color?: 'red' | 'green' | 'blue' | 'white';
  /** Cost to buy from the parts drawer ($). */
  cost: number;
  description: string;
  /** Pin names in footprint pad order, for parts whose pinout is not implied by their kind. */
  pins?: string[];
  /** Plastic body: overheating past this (°C) melts it. */
  heatLimit?: number;
  /** Swapped by hand (plugged in), not soldered: batteries, screens, speakers, LED strips. */
  plugIn?: boolean;
  /**
   * Heat a big chip makes while running its firmware (W, game-scaled). It needs its
   * heatsink: without one it hits thermal shutdown in seconds.
   */
  heatW?: number;
  /**
   * Extra supply rails of a big chip (processor, SoC). The chip only boots when every rail is
   * above its UVLO; each rail draws `amps` while the chip runs and `standbyAmps` otherwise.
   */
  rails?: ChipRail[];
  /** Linear regulators: dropout (V) and current limit (A); the output is `value`. */
  dropout?: number;
  ilim?: number;
  /** Buttons: a latching switch (slide / toggle) that stays closed — its contacts can oxidise. */
  latched?: boolean;
  /** Generic logic chip (kind 'logic'): see LogicSpec. */
  logic?: LogicSpec;
}

/**
 * A chip modelled by what it does, not how: once its supply is up, each channel drives its
 * outputs high while its conditions hold (inputs high / low). ROMs, lockout chips, video
 * chips, modulators, wireless chips, counters…
 */
export interface LogicSpec {
  vcc: string;
  /** Minimum supply to work (V). */
  vmin: number;
  /** Supply current while powered (A). */
  iq: number;
  ch: { needHigh?: string[]; needLow?: string[]; outs: string[] }[];
}

export interface ChipRail {
  pin: string;
  nominal: number;
  uvlo: number;
  amps: number;
  standbyAmps?: number;
}

const r = (partNo: string, value: number, label: string, marking: string, pkg: Pkg = '0603'): PartSpec => ({
  partNo,
  kind: 'resistor',
  pkg,
  value,
  label,
  marking,
  cost: pkg === '1206' ? 0.15 : 0.1,
  description: `${label}Ω resistor, ${pkg}`,
});

const cap = (partNo: string, pkg: Pkg, value: number, label: string, rating: number, cost: number, kind: Kind = 'capacitor'): PartSpec => ({
  partNo,
  kind,
  pkg,
  value,
  label,
  marking: kind === 'electrolytic' ? label.replace('µF', '').replace(' ', ' ') : '',
  rating,
  cost,
  description: kind === 'electrolytic' ? `${label} aluminium electrolytic (polarised)` : `${label} ceramic, ${pkg}`,
});

const mcuPins = (...io: string[]) => ['VDD', ...io, 'GND'];

/** DIP pin names in footprint order: named pins by number, the rest NC<n>. */
export function dipPins(n: number, named: Record<number, string>): string[] {
  return Array.from({ length: n }, (_, i) => named[i + 1] ?? `NC${i + 1}`);
}

export const PARTS: Record<string, PartSpec> = {
  // ---------------------------------------------------------------- resistors (EIA markings)
  'R-10R-1206': r('R-10R-1206', 10, '10', '100', '1206'),
  'R-33R-1206': r('R-33R-1206', 33, '33', '330', '1206'),
  'R-2R0-1206': r('R-2R0-1206', 2, '2.0 (sense)', '2R0', '1206'),
  'R-0R05-1206': r('R-0R05-1206', 0.05, '0.05 (sense)', 'R050', '1206'),
  'R-100R': r('R-100R', 100, '100', '101'),
  'R-220R': r('R-220R', 220, '220', '221'),
  'R-1K': r('R-1K', 1000, '1k', '102'),
  'R-4K7': r('R-4K7', 4700, '4.7k', '472'),
  'R-10K': r('R-10K', 10000, '10k', '103'),
  'R-2K2': r('R-2K2', 2200, '2.2k', '222'),
  'R-3K': r('R-3K', 3000, '3k', '302'),
  'R-22K': r('R-22K', 22000, '22k', '223'),
  'R-47K': r('R-47K', 47000, '47k', '473'),
  'R-52K3': r('R-52K3', 52300, '52.3k', '71C'),
  'R-100K': r('R-100K', 100000, '100k', '104'),

  // ---------------------------------------------------------------- capacitors
  'C-100N': cap('C-100N', '0603', 100e-9, '100nF 16V', 16, 0.05),
  'C-1U': cap('C-1U', '0603', 1e-6, '1µF 10V', 10, 0.05),
  'C-10U-25': cap('C-10U-25', '1206', 10e-6, '10µF 25V', 25, 0.2),
  'C-10U-6': cap('C-10U-6', '1206', 10e-6, '10µF 6.3V', 6.3, 0.15),
  'C-22U-10': cap('C-22U-10', '1206', 22e-6, '22µF 10V', 10, 0.2),
  'C-4U7-50': cap('C-4U7-50', '1206', 4.7e-6, '4.7µF 50V', 50, 0.35),
  'C-100U-25': cap('C-100U-25', 'CAP_EL', 100e-6, '100µF 25V', 25, 0.4, 'electrolytic'),
  'C-470U-35': cap('C-470U-35', 'CAP_EL10', 470e-6, '470µF 35V', 35, 0.9, 'electrolytic'),
  'C-1000U-16': cap('C-1000U-16', 'CAP_EL10', 1000e-6, '1000µF 16V', 16, 0.9, 'electrolytic'),

  // ---------------------------------------------------------------- protection
  'F-1A': { partNo: 'F-1A', kind: 'fuse', pkg: '1206', value: 1, label: '1A fast', marking: 'H', rating: 1, cost: 0.3, description: '1 A fast-blow SMD fuse, 1206' },
  'F-3A': { partNo: 'F-3A', kind: 'fuse', pkg: '1206', value: 3, label: '3A fast', marking: 'N', rating: 3, cost: 0.35, description: '3 A fast-blow SMD fuse, 1206' },
  'F-5A': { partNo: 'F-5A', kind: 'fuse', pkg: '1206', value: 5, label: '5A fast', marking: 'P', rating: 5, cost: 0.3, description: '5 A fast-blow SMD fuse, 1206' },
  'F-8A': { partNo: 'F-8A', kind: 'fuse', pkg: '1206', value: 8, label: '8A fast', marking: 'S', rating: 8, cost: 0.4, description: '8 A fast-blow SMD fuse, 1206' },
  'F-POLY05': { partNo: 'F-POLY05', kind: 'fuse', pkg: '1206', value: 0.5, label: '0.5A polyfuse', marking: 'P05', rating: 0.5, cost: 0.25, description: '0.5 A resettable polyfuse (protects the HDMI 5 V line), 1206' },
  'D-TVS15': { partNo: 'D-TVS15', kind: 'tvs', pkg: 'SMA', value: 16.7, label: '15V TVS', marking: 'KE', cost: 0.35, description: '15 V standoff unidirectional TVS diode, SMA' },
  'D-TVS24': { partNo: 'D-TVS24', kind: 'tvs', pkg: 'SMA', value: 26.7, label: '24V TVS', marking: 'KX', cost: 0.35, description: '24 V standoff unidirectional TVS diode, SMA' },
  'D-TVS5': { partNo: 'D-TVS5', kind: 'tvs', pkg: 'SOD123', value: 6.4, label: '5V TVS', marking: 'T5', cost: 0.2, description: '5 V standoff TVS for USB inputs, SOD-123' },
  'D-ESD5': { partNo: 'D-ESD5', kind: 'tvs', pkg: 'SOD123', value: 6.8, label: 'ESD diode', marking: 'E5', cost: 0.15, description: 'Low-capacitance ESD protection diode for a high-speed data line, SOD-123' },
  'D-Z10': { partNo: 'D-Z10', kind: 'zener', pkg: 'SOD123', value: 10, label: '10V zener', marking: 'Z10', cost: 0.1, description: '10 V zener diode, SOD-123' },
  'D-SS14': { partNo: 'D-SS14', kind: 'diode', pkg: 'SMA', value: 0.45, label: 'Schottky 1A', marking: 'S14', cost: 0.15, description: '1 A 40 V Schottky diode, SMA' },
  'D-SS36': { partNo: 'D-SS36', kind: 'diode', pkg: 'SMA', value: 0.5, label: 'Schottky 3A 60V', marking: 'S36', cost: 0.25, description: '3 A 60 V Schottky diode, SMA' },

  // ---------------------------------------------------------------- LEDs
  'LED-GRN': { partNo: 'LED-GRN', kind: 'led', pkg: 'LED0805', value: 2.1, label: 'Green LED', marking: '', color: 'green', cost: 0.1, description: 'Green LED, 0805' },
  'LED-BLU': { partNo: 'LED-BLU', kind: 'led', pkg: 'LED0805', value: 2.8, label: 'Blue LED', marking: '', color: 'blue', cost: 0.1, description: 'Blue LED, 0805' },
  'LED-WHT': { partNo: 'LED-WHT', kind: 'led', pkg: 'LED0805', value: 2.9, label: 'White LED', marking: '', color: 'white', cost: 0.12, description: 'White LED, 0805' },
  'LED-RED': { partNo: 'LED-RED', kind: 'led', pkg: 'LED0805', value: 1.9, label: 'Red LED', marking: '', color: 'red', cost: 0.1, description: 'Red LED, 0805' },
  'LED-COB3': { partNo: 'LED-COB3', kind: 'cob', pkg: 'COB', value: 8.7, label: 'COB 1W white', marking: 'LUMA-3', color: 'white', cost: 2.5, description: 'White COB LED module, 3 junctions in series, 100 mA' },

  // ---------------------------------------------------------------- transistors
  'Q-PFET': { partNo: 'Q-PFET', kind: 'pmos', pkg: 'SOT23', value: 0, label: 'P-MOSFET -30V', marking: 'P3A', cost: 0.25, description: 'P-channel MOSFET, -30 V, 40 mΩ, SOT-23' },
  'Q-NFET': { partNo: 'Q-NFET', kind: 'nmos', pkg: 'SOT23', value: 0, label: 'N-MOSFET 30V', marking: 'N3B', cost: 0.2, description: 'N-channel logic-level MOSFET, 30 V, 50 mΩ, SOT-23' },
  'Q-NPWR': { partNo: 'Q-NPWR', kind: 'nmos', pkg: 'DPAK', value: 0, label: 'N-MOSFET 60V 30A', marking: 'N60D', cost: 0.9, description: 'N-channel power MOSFET, 60 V, 12 mΩ, DPAK. Pinout: G, S, D (tab).' },
  'Q-PPWR': { partNo: 'Q-PPWR', kind: 'pmos', pkg: 'DPAK', value: 0, label: 'P-MOSFET -30V 20A', marking: 'P30D', cost: 1.1, description: 'P-channel power MOSFET, -30 V, 20 mΩ, DPAK. Pinout: G, S, D (tab).' },

  // ---------------------------------------------------------------- magnetics
  'L-10U': { partNo: 'L-10U', kind: 'inductor', pkg: 'IND5', value: 10e-6, label: '10µH 2.5A', marking: '100', cost: 0.5, description: '10 µH 2.5 A shielded power inductor' },
  'L-22U': { partNo: 'L-22U', kind: 'inductor', pkg: 'IND5', value: 22e-6, label: '22µH 2A', marking: '220', cost: 0.55, description: '22 µH 2 A shielded power inductor' },

  // ---------------------------------------------------------------- regulators & ICs (fictional)
  'U-VX2302': { partNo: 'U-VX2302', kind: 'buck', pkg: 'SOT23-6', value: 0.8, label: 'VX2302 buck', marking: 'VX2302', cost: 1.2, description: 'Vexor VX2302: 2 A synchronous buck converter, 4.5–28 V in, 0.8 V reference. Pinout: 1 BST, 2 GND, 3 FB, 4 EN (on > 1.2 V), 5 IN, 6 SW.' },
  'U-HL33': { partNo: 'U-HL33', kind: 'ldo', pkg: 'SOT223', value: 3.3, label: 'HL1133 3.3V LDO', marking: 'HL33', rating: 6, cost: 0.6, description: 'Halden HL1133: 3.3 V 400 mA LDO, 6 V absolute max input. Pinout: 1 GND, 2 OUT, 3 IN, tab OUT.' },
  'U-LS1T': {
    partNo: 'U-LS1T',
    kind: 'shifter',
    pkg: 'SOT23-6',
    value: 0,
    label: 'LS1T level shifter',
    marking: 'LS1',
    cost: 0.45,
    pins: ['VA', 'GND', 'A', 'B', 'VB', 'EN'],
    description:
      'Quill LS1T single-channel level shifter: copies a logic signal from the A side (powered by VA) to the B side (powered by VB). Pinout: 1 VA, 2 GND, 3 A in, 4 B out, 5 VB, 6 EN. Test it like a detective: if A is high and both supplies are there, B should be high too.',
  },
  'U-TC41': {
    partNo: 'U-TC41',
    kind: 'charger',
    pkg: 'SOT23-6',
    value: 1,
    label: 'TC4100 charger',
    marking: 'TC41',
    cost: 1.4,
    pins: ['VBUS', 'GND', 'BAT', 'STAT', 'NC5', 'NC6'],
    description: 'Tidewell TC4100: single-cell Li-ion charger, 1 A, 4.2 V float. STAT pulls low while charging. Pinout: 1 VBUS, 2 GND, 3 BAT, 4 STAT.',
  },
  'U-LX9201': {
    partNo: 'U-LX9201',
    kind: 'retimer',
    pkg: 'SOIC8',
    value: 3.3,
    label: 'LX9201 HDMI retimer',
    marking: 'LX9201',
    cost: 28,
    pins: ['VCC', 'EN', 'IN', 'GND', 'CK', 'D0', 'D1', 'D2'],
    description: 'Lumora LX9201: HDMI 2.1 retimer. Cleans up the video signal between the APU and the HDMI port. 3.3 V. EN high = on. Pinout: 1 VCC, 2 EN, 3 IN (video from APU), 4 GND, 5 CK, 6 D0, 7 D1, 8 D2. Outputs D0–D2 and CK drive the TV through the port; each line reads ~0.5 V in diode mode to ground when healthy.',
  },
  'U-SA8002': {
    partNo: 'U-SA8002',
    kind: 'amp',
    pkg: 'SOIC8',
    value: 3,
    label: 'SA8002 audio amp',
    marking: 'SA8002',
    cost: 1.8,
    pins: ['VDD', 'EN', 'NC3', 'NC4', 'OUTP', 'OUTN', 'NC7', 'GND'],
    description: 'Sonique SA8002: 3 W mono class-D speaker amplifier, 2.5–5.5 V. EN high = on. Outputs OUT+ / OUT− drive the speaker directly (bridge-tied, never ground either side).',
  },
  'U-LB693': {
    partNo: 'U-LB693',
    kind: 'boost',
    pkg: 'SOIC8',
    value: 0.2,
    label: 'LB693 backlight boost',
    marking: 'LB693',
    cost: 2.4,
    pins: ['VIN', 'EN', 'FB', 'GATE', 'SW', 'OUT', 'NC7', 'GND'],
    description: 'Lumina LB693: LED backlight boost controller, 8–28 V in, up to 45 V out (over-voltage protected). Regulates FB to 0.2 V across the current-sense resistor. Drives an external N-MOSFET from GATE.',
  },
  'U-PIC8': { partNo: 'U-PIC8', kind: 'mcu', pkg: 'SOIC8', value: 3.3, label: 'Picoroo P8 MCU (lamp fw)', marking: 'P8-L12', cost: 3.5, pins: mcuPins('STAT', 'LAMP', 'NRST', 'BTN', 'NC6', 'NC7'), description: 'Picoroo P8 8-pin microcontroller with factory-programmed lamp firmware. 1.8–3.6 V supply. NRST active low, no internal pull-up. Pinout: 1 VDD, 2 STAT, 3 LAMP, 4 NRST, 5 BTN, 6 NC, 7 NC, 8 GND.' },
  'U-PIC8-SPK': { partNo: 'U-PIC8-SPK', kind: 'mcu', pkg: 'SOIC8', value: 3.3, label: 'Picoroo P8 MCU (speaker fw)', marking: 'P8-S40', cost: 3.5, pins: mcuPins('LED', 'AMPEN', 'BTN', 'CHG', 'BTEN', 'NC7'), description: 'Picoroo P8 with factory-programmed Bluetooth-speaker firmware. Pinout: 1 VDD, 2 LED, 3 AMP_EN, 4 BTN, 5 CHG (charge status in), 6 BT_EN (Bluetooth chip enable), 8 GND.' },
  'U-PIC8-SBX': { partNo: 'U-PIC8-SBX', kind: 'mcu', pkg: 'SOIC8', value: 3.3, label: 'Picoroo P8 MCU (standby fw)', marking: 'P8-X1S', cost: 3.5, pins: mcuPins('LED', 'MAINEN', 'BTN', 'PG', 'NC6', 'NC7'), description: 'Picoroo P8 with factory-programmed console standby/power-sequencing firmware. Turns the main 12 V on when the power button is pressed and shuts it off again if PG (power good) does not come up. Pinout: 1 VDD, 2 LED, 3 MAIN_EN, 4 BTN, 5 PG, 8 GND.' },
  'U-APU-F5': {
    partNo: 'U-APU-F5',
    kind: 'mcu',
    pkg: 'QFP16',
    value: 3.3,
    label: 'Funstation 5 APU',
    marking: 'FS5-APU',
    cost: 95,
    heatW: 3.6,
    pins: ['VDD', 'RTEN', 'VID', 'HPD', 'LED', 'BTN', 'NC7', 'NC8', 'NC9', 'NC10', 'NC11', 'NC12', 'NC13', 'NC14', 'NC15', 'GND'],
    description: 'The Funstation 5 main processor (CPU + GPU). Sends video to the retimer (VID) when the TV is detected on HPD, and enables the retimer (RTEN). Extremely expensive — usually sourced from donor boards.',
  },
  'U-SOC-BTN': {
    partNo: 'U-SOC-BTN',
    kind: 'mcu',
    pkg: 'QFP16',
    value: 3.3,
    label: 'Button handheld SoC',
    marking: 'BTN-SOC',
    cost: 48,
    pins: ['VDD', 'BLEN', 'BTN', 'CHG', 'LED', 'NC6', 'NC7', 'NC8', 'NC9', 'NC10', 'NC11', 'NC12', 'NC13', 'NC14', 'NC15', 'GND'],
    description: 'Button handheld system-on-chip. Power button toggles the console on; turns the screen backlight on (BL_EN) while running; lights the charge LED from CHG. Expensive — often taken from donor boards.',
  },
  'U-SCL24': {
    partNo: 'U-SCL24',
    kind: 'mcu',
    pkg: 'QFP16',
    value: 3.3,
    label: 'ViewMax scaler',
    marking: 'VMX-SC24',
    cost: 22,
    pins: ['VDD', 'BLEN', 'BTN', 'LED', 'NC5', 'NC6', 'NC7', 'NC8', 'NC9', 'NC10', 'NC11', 'NC12', 'NC13', 'NC14', 'NC15', 'GND'],
    description: 'ViewMax monitor scaler (the picture processor). Power button toggles on/off; enables the backlight driver (BL_EN) once running. Factory firmware.',
  },

  // ---------------------------------------------------------------- connectors (plastic bodies — heat sensitive)
  'J-BARREL': { partNo: 'J-BARREL', kind: 'jack', pkg: 'BARREL', value: 0, label: '5.5×2.1 DC jack', marking: '', cost: 0.8, heatLimit: 280, description: '5.5 × 2.1 mm DC barrel jack, centre positive' },
  'J-USBC': { partNo: 'J-USBC', kind: 'connector', pkg: 'USBC', value: 0, label: 'USB-C port', marking: '', cost: 1.2, heatLimit: 260, pins: ['VBUS', 'CC', 'GND', 'SHLD'], description: 'USB-C receptacle, mid-mount. Plastic tongue inside — keep the heat down.' },
  'J-MUSB': { partNo: 'J-MUSB', kind: 'connector', pkg: 'MUSB', value: 0, label: 'Micro-USB port', marking: '', cost: 0.5, heatLimit: 250, pins: ['VBUS', 'DM', 'DP', 'GND', 'SHLD'], description: 'Micro-USB receptacle. Tiny pads, easily ripped off by a yanked cable.' },
  'J-HDMI': { partNo: 'J-HDMI', kind: 'connector', pkg: 'HDMI', value: 0, label: 'HDMI port', marking: '', cost: 6, heatLimit: 260, pins: ['D2', 'D1', 'D0', 'CK', '5V', 'HPD', 'GND', 'SHLD'], description: 'HDMI type-A receptacle. The plastic tongue melts if overheated — low-melt solder and gentle hot air are your friends.' },
  'J-PWR2': { partNo: 'J-PWR2', kind: 'connector', pkg: 'PWR2', value: 0, label: '2-pin power header', marking: '', cost: 0.9, heatLimit: 280, pins: ['12V', 'GND'], description: 'Through-hole 2-pin power header from the internal PSU.' },
  'J-JST2': { partNo: 'J-JST2', kind: 'connector', pkg: 'JST2', value: 0, label: '2-pin wire connector', marking: '', cost: 0.3, heatLimit: 240, pins: ['1', '2'], description: '2-pin wire-to-board connector (speaker / LED strip / battery leads).' },
  'J-FPC2': { partNo: 'J-FPC2', kind: 'connector', pkg: 'FPC2', value: 0, label: 'Screen ribbon connector', marking: '', cost: 0.8, heatLimit: 230, pins: ['BL+', 'BL-'], description: 'Flip-lock ribbon (FPC) connector for the screen. Fragile latch and a very heat-sensitive plastic body.' },

  // ---------------------------------------------------------------- plug-in modules (swapped by hand)
  'M-BATT-1S': { partNo: 'M-BATT-1S', kind: 'battery', pkg: 'BATT', value: 3.8, label: 'Li-ion pack 3.7V 2000mAh', marking: '3.7V', cost: 12, plugIn: true, pins: ['+', '-'], description: 'Single-cell Li-ion battery pack with lead and plug.' },
  'M-SCREEN-B': { partNo: 'M-SCREEN-B', kind: 'module', pkg: 'SCREEN', value: 2.9, label: 'Button screen module', marking: '', cost: 24, plugIn: true, pins: ['BL+', 'BL-'], description: 'Replacement Button LCD module with ribbon cable. The backlight is an LED inside the module.' },
  'M-SPK4': { partNo: 'M-SPK4', kind: 'module', pkg: 'SPK', value: 4, label: '4Ω speaker', marking: '4Ω 3W', cost: 3, plugIn: true, pins: ['1', '2'], description: '4 Ω 3 W speaker with lead and plug. Reads about 4 Ω on the meter.' },
  'M-LEDBAR': { partNo: 'M-LEDBAR', kind: 'module', pkg: 'LEDBAR', value: 30, label: 'Backlight LED strip', marking: '', cost: 15, plugIn: true, pins: ['A', 'K'], description: 'ViewMax 24 backlight LED strip: 10 white LEDs in series (~30 V at 100 mA).' },

  // ---------------------------------------------------------------- mechanical
  // ---------------------------------------------------------------- retro / through-hole
  'U-7805T': {
    partNo: 'U-7805T',
    kind: 'ldo',
    pkg: 'TO220',
    value: 5,
    dropout: 2,
    ilim: 1,
    label: '7805 5V regulator',
    marking: 'KA7805',
    rating: 35,
    cost: 0.5,
    pins: ['IN', 'GND', 'OUT'],
    description: 'Classic 5 V 1 A linear regulator in a TO-220 can. Needs about 7 V in; burns the difference as heat. Pinout: IN, GND, OUT.',
  },
  'C-470U-16': cap('C-470U-16', 'CAP_EL10', 470e-6, '470µF 16V', 16, 0.5, 'electrolytic'),
  'C-10U-16E': cap('C-10U-16E', 'CAP_EL', 10e-6, '10µF 16V', 16, 0.2, 'electrolytic'),
  // ---------------------------------------------------------------- Bintendo Entertainment System (+ cart)
  'U-BES-CPU': {
    partNo: 'U-BES-CPU',
    kind: 'mcu',
    pkg: 'DIP40',
    value: 5,
    label: 'BES CPU',
    marking: 'BPU-2A03',
    rating: 6,
    cost: 18,
    pins: dipPins(40, { 1: 'RST', 2: 'CE', 3: 'DIN', 4: 'LED', 5: 'VEN', 20: 'GND', 40: 'VDD' }),
    description: 'The console processor. Held in reset (RST low) by the lockout chip until the cartridge answers; then reads the game (DIN) and tells the picture chip to draw (VEN).',
  },
  'U-BES-PPU': {
    partNo: 'U-BES-PPU',
    kind: 'logic',
    pkg: 'DIP40',
    value: 5,
    label: 'BES picture chip',
    marking: 'BPU-2C02',
    cost: 16,
    pins: dipPins(40, { 1: 'VEN', 2: 'VID', 20: 'GND', 40: 'VCC' }),
    logic: { vcc: 'VCC', vmin: 4.2, iq: 0.06, ch: [{ needHigh: ['VEN'], outs: ['VID'] }] },
    description: 'Draws the picture: composite video out (VID) whenever the CPU enables it (VEN).',
  },
  'U-LOCK-C': {
    partNo: 'U-LOCK-C',
    kind: 'logic',
    pkg: 'DIP16',
    value: 5,
    label: 'Lockout chip (console)',
    marking: 'BIC-3193',
    cost: 4,
    pins: dipPins(16, { 1: 'KI', 2: 'KO', 3: 'RST', 8: 'GND', 16: 'VCC' }),
    logic: { vcc: 'VCC', vmin: 4.2, iq: 0.004, ch: [{ outs: ['KO'] }, { needHigh: ['KI'], outs: ['RST'] }] },
    description: 'Talks to the matching chip in the cartridge (KO out, KI back). No answer = it holds the CPU in reset over and over: the famous blinking power light.',
  },
  'U-LOCK-G': {
    partNo: 'U-LOCK-G',
    kind: 'logic',
    pkg: 'DIP16',
    value: 5,
    label: 'Lockout chip (cartridge)',
    marking: 'BIC-3195',
    cost: 4,
    pins: dipPins(16, { 1: 'KI', 2: 'KO', 8: 'GND', 16: 'VCC' }),
    logic: { vcc: 'VCC', vmin: 4.2, iq: 0.004, ch: [{ needHigh: ['KI'], outs: ['KO'] }] },
    description: "The cartridge's half of the lockout handshake: answers the console (KI in, KO back).",
  },
  'U-ROM-BES': {
    partNo: 'U-ROM-BES',
    kind: 'logic',
    pkg: 'DIP28',
    value: 5,
    label: 'Game ROM (mask)',
    marking: 'BES-ROM',
    cost: 0,
    pins: dipPins(28, { 1: 'CE', 2: 'DO', 14: 'GND', 28: 'VCC' }),
    logic: { vcc: 'VCC', vmin: 4.2, iq: 0.02, ch: [{ needHigh: ['CE'], outs: ['DO'] }] },
    description: 'The game itself, burned into the chip at the factory. Nobody sells these: a dead one only comes from a donor cartridge of the same game.',
  },
  'U-SRAM8K': {
    partNo: 'U-SRAM8K',
    kind: 'logic',
    pkg: 'DIP28',
    value: 5,
    label: '8K save RAM',
    marking: 'LH5164',
    cost: 3,
    pins: dipPins(28, { 14: 'GND', 28: 'VCC' }),
    logic: { vcc: 'VCC', vmin: 2.0, iq: 0.0005, ch: [] },
    description: 'Battery-backed save memory: keeps your saved games as long as it sees at least 2 V — from the console when it is on, from the coin cell when it is off.',
  },
  'U-RFMOD': {
    partNo: 'U-RFMOD',
    kind: 'logic',
    pkg: 'RFMOD',
    value: 5,
    label: 'RF modulator',
    marking: 'RF-3/4',
    cost: 6,
    pins: ['5V', 'GND', 'VID', 'RF'],
    logic: { vcc: '5V', vmin: 4.2, iq: 0.03, ch: [{ needHigh: ['VID'], outs: ['RF'] }] },
    description: 'Turns composite video into a TV channel (RF out to the aerial socket). Dead modulator: picture on AV, none on RF.',
  },

  ...retroChips(),

  'J-EDGE6': { partNo: 'J-EDGE6', kind: 'connector', pkg: 'EDGE6', value: 0, label: 'Cartridge edge fingers', marking: '', cost: 0, pins: ['5V', 'GND', 'CE', 'D0', 'LKI', 'LKO'], description: 'Gold-plated fingers along the cartridge board edge. They dull and oxidise with age: scrub them with an eraser, then treat with Pad-Bright.' },
  'J-SLOT6': { partNo: 'J-SLOT6', kind: 'connector', pkg: 'CARTSLOT6', value: 0, label: 'Cartridge slot', marking: '', cost: 6, heatLimit: 280, pins: ['5V', 'GND', 'CE', 'D0', 'LKI', 'LKO'], description: 'Cartridge slot connector. Its springy contacts tarnish and lose their grip over the years.' },
  'J-TFSLOT': { partNo: 'J-TFSLOT', kind: 'connector', pkg: 'TFSLOT', value: 0, label: 'microSD card slot', marking: '', cost: 1.2, heatLimit: 260, pins: ['5V', 'GND', 'CE', 'D0', 'LKI', 'LKO'], description: 'Push-push microSD slot. Emulation handhelds load their games from the card in here.' },
  'J-RCA': { partNo: 'J-RCA', kind: 'connector', pkg: 'RCA2', value: 0, label: 'RCA jack', marking: '', cost: 0.6, pins: ['SIG', 'GND'], description: 'Panel RCA (phono) jack: composite video or RF out.' },
  'J-HDR3': { partNo: 'J-HDR3', kind: 'connector', pkg: 'HDR3', value: 0, label: '3-pin port', marking: '', cost: 0.4, pins: ['5V', 'DATA', 'GND'], description: '3-pin controller / accessory port.' },
  'J-FPC3': { partNo: 'J-FPC3', kind: 'connector', pkg: 'FPC3', value: 0, label: '3-pin FPC connector', marking: '', cost: 0.5, heatLimit: 260, pins: ['VCC', 'DATA', 'GND'], description: '3-pin flip-latch ribbon connector (screen).' },
  'BT-CR2032T': { partNo: 'BT-CR2032T', kind: 'battery', pkg: 'COIN', value: 3.0, label: 'CR2032 with solder tabs', marking: 'CR2032', cost: 1.5, pins: ['+', '-'], description: 'Tabbed 3 V lithium coin cell for save memory. Solder the tabs, never the cell itself — heat ruins it.' },
  'M-STICK': { partNo: 'M-STICK', kind: 'stick', pkg: 'STICK', value: 10e3, label: 'Analog stick module', marking: 'ALPS-ish', cost: 4, description: 'Thumbstick with two 10 kΩ potentiometers (X and Y). Centre = half the supply on each wiper.' },
  'J-AA2': { partNo: 'J-AA2', kind: 'connector', pkg: 'SPRING2', value: 0, label: 'Battery springs', marking: '', cost: 1, pins: ['+', '-'], description: 'Battery compartment spring and plate contacts (2 × AA). Leaky batteries rust them.' },
  'M-AA2': { partNo: 'M-AA2', kind: 'battery', pkg: 'AA2', value: 3.0, label: '2 × AA batteries', marking: 'AA', cost: 2, plugIn: true, pins: ['+', '-'], description: 'Two fresh AA cells (3 V).' },

  'SW-SLIDE': { partNo: 'SW-SLIDE', kind: 'button', pkg: 'SLIDE', value: 0, label: 'Power switch (slide)', marking: '', cost: 1.2, latched: true, pins: ['1', '2'], description: 'Latching slide power switch. Its contacts oxidise with age: the console then powers on only now and then. Clean the contacts.' },
  'M-JUMPERPAK': { partNo: 'M-JUMPERPAK', kind: 'module', pkg: 'PAK', value: 0.05, label: 'Jumper pak', marking: 'JUMPER', cost: 8, plugIn: true, pins: ['A', 'B'], description: 'Plug-in terminator for the memory expansion slot. Without it (or an expansion pak) the console shows a black screen.' },
  'J-EXP2': { partNo: 'J-EXP2', kind: 'connector', pkg: 'JST2', value: 0, label: 'Expansion slot', marking: '', cost: 3, pins: ['A', 'B'], description: 'Memory expansion slot: needs a jumper pak or expansion pak plugged in.' },
  'U-PAD-MCU': {
    partNo: 'U-PAD-MCU',
    kind: 'mcu',
    pkg: 'QFP16',
    value: 3.3,
    label: 'Controller MCU',
    marking: 'PADCTL',
    cost: 0,
    pins: ['VDD', 'HOME', 'BA', 'BB', 'TRIG', 'TPD', 'BTEN', 'LED', 'TEN', 'NC10', 'NC11', 'NC12', 'NC13', 'NC14', 'NC15', 'GND'],
    description: 'The controller brain: reads the buttons, sticks and touchpad, and runs the wireless chip. Factory-programmed — donor boards only.',
  },
  'U-BT': {
    partNo: 'U-BT',
    kind: 'logic',
    pkg: 'SOT23-6',
    value: 3.3,
    label: 'Wireless chip',
    marking: 'BTW1',
    cost: 4,
    pins: ['VCC', 'GND', 'EN', 'LINK', 'NC5', 'NC6'],
    logic: { vcc: 'VCC', vmin: 2.6, iq: 0.015, ch: [{ needHigh: ['EN'], outs: ['LINK'] }] },
    description: 'Bluetooth-ish wireless chip: pairs and links once enabled (EN), signalling LINK. Swapping one is small-QFN-style rework.',
  },
  'M-TOUCHPAD': {
    partNo: 'M-TOUCHPAD',
    kind: 'logic',
    pkg: 'TPAD',
    value: 3.3,
    label: 'Touchpad assembly',
    marking: '',
    cost: 9,
    plugIn: true,
    pins: ['VCC', 'TEN', 'TOUT', 'GND'],
    logic: { vcc: 'VCC', vmin: 2.6, iq: 0.006, ch: [{ needHigh: ['TEN'], outs: ['TOUT'] }] },
    description: 'Touchpad with its own ribbon. A torn ribbon means replacing the whole assembly.',
  },
  'J-FPC4': { partNo: 'J-FPC4', kind: 'connector', pkg: 'FPC4', value: 0, label: 'Touchpad ribbon connector', marking: '', cost: 0.5, heatLimit: 260, pins: ['VCC', 'TEN', 'TOUT', 'GND'], description: 'Flip-latch ribbon connector for the touchpad.' },
  'SW-TRIG': { partNo: 'SW-TRIG', kind: 'button', pkg: 'TACT6', value: 0, label: 'Trigger switch + spring', marking: '', cost: 1.5, description: 'Trigger mechanism: a switch with a return spring. A broken spring leaves it stuck pressed.' },
  ...handheldParts(),
  'J-CELLCLIP': { partNo: 'J-CELLCLIP', kind: 'connector', pkg: 'JST2', value: 0, label: 'Coin-cell clip', marking: '', cost: 0.8, pins: ['+', '-'], description: 'Spring clip holding the button cells. Its contacts tarnish when cells leak.' },
  'M-LR44X2': { partNo: 'M-LR44X2', kind: 'battery', pkg: 'COIN', value: 3.0, label: '2 × LR44 button cells', marking: 'LR44', cost: 1.5, plugIn: true, pins: ['+', '-'], description: 'Two 1.5 V button cells in series.' },
  'U-OSC14': { partNo: 'U-OSC14', kind: 'logic', pkg: 'DIP14', value: 5, label: 'Clock oscillator', marking: 'OSC 10MHz', cost: 2.5, pins: dipPins(14, { 7: 'GND', 8: 'OUT', 14: 'VCC' }), logic: { vcc: 'VCC', vmin: 4.2, iq: 0.02, ch: [{ outs: ['OUT'] }] }, description: 'Canned crystal oscillator: the master clock for the whole board.' },
  'U-CNT16': { partNo: 'U-CNT16', kind: 'logic', pkg: 'DIP16', value: 5, label: '4-bit counter', marking: 'SN74161N', cost: 1.2, pins: dipPins(16, { 1: 'CLK', 2: 'Q', 8: 'GND', 16: 'VCC' }), logic: { vcc: 'VCC', vmin: 4.2, iq: 0.03, ch: [{ needHigh: ['CLK'], outs: ['Q'] }] }, description: 'Synchronous 4-bit counter: counts clock pulses. A dead one gives good inputs, no outputs on the scope.' },
  'U-SHIFT16': { partNo: 'U-SHIFT16', kind: 'logic', pkg: 'DIP16', value: 5, label: 'Shift register', marking: 'SN74166N', cost: 1.5, pins: dipPins(16, { 1: 'CLK', 2: 'D', 3: 'VID', 8: 'GND', 16: 'VCC' }), logic: { vcc: 'VCC', vmin: 4.2, iq: 0.03, ch: [{ needHigh: ['CLK', 'D'], outs: ['VID'] }] }, description: 'Shifts graphics data out as video, one pixel per clock.' },
  'U-EPROM-GR': { partNo: 'U-EPROM-GR', kind: 'logic', pkg: 'DIP28', value: 5, label: 'Graphics EPROM (programmed)', marking: '2716-GR', cost: 12, pins: dipPins(28, { 1: 'CE', 2: 'DO', 14: 'GND', 28: 'VCC' }), logic: { vcc: 'VCC', vmin: 4.2, iq: 0.03, ch: [{ needHigh: ['CE'], outs: ['DO'] }] }, description: 'UV-erasable EPROM holding the graphics, programmed with the Galaxy Raid image (needs a three-voltage programmer — we buy them pre-programmed).' },
  'U-LINEDRV': { partNo: 'U-LINEDRV', kind: 'logic', pkg: 'DIP14', value: 5, label: 'Video line driver', marking: 'DS8830-ish', cost: 30, pins: dipPins(14, { 1: 'IN', 2: 'OUT', 7: 'GND', 14: 'VCC' }), logic: { vcc: 'VCC', vmin: 4.2, iq: 0.04, ch: [{ needHigh: ['IN'], outs: ['OUT'] }] }, description: 'Rare line driver that pushes the video down the cable to the monitor. Only from abroad.' },
  'U-NOISE14': { partNo: 'U-NOISE14', kind: 'logic', pkg: 'DIP14', value: 5, label: 'Noise generator', marking: 'SN76477-ish', cost: 9, pins: dipPins(14, { 1: 'EN', 2: 'AOUT', 7: 'GND', 14: 'VCC' }), logic: { vcc: 'VCC', vmin: 4.2, iq: 0.02, ch: [{ needHigh: ['EN'], outs: ['AOUT'] }] }, description: 'Makes the explosion and engine noises.' },
  'SW-TACT': { partNo: 'SW-TACT', kind: 'button', pkg: 'TACT6', value: 0, label: 'Tact switch', marking: '', cost: 0.15, description: '6 × 6 mm tactile switch' },
  TP: { partNo: 'TP', kind: 'testpoint', pkg: 'TP', value: 0, label: 'Test point', marking: '', cost: 0, description: 'Test pad' },
};

export function part(partNo: string): PartSpec {
  const p = PARTS[partNo];
  if (!p) throw new Error(`Unknown part ${partNo}`);
  return p;
}

/** Default pin names by kind, in package pad order (parts may override with `pins`). */
export const PIN_NAMES: Record<Kind, string[]> = {
  resistor: ['1', '2'],
  capacitor: ['1', '2'],
  electrolytic: ['+', '-'],
  fuse: ['1', '2'],
  inductor: ['1', '2'],
  diode: ['A', 'K'],
  tvs: ['A', 'K'],
  zener: ['A', 'K'],
  led: ['A', 'K'],
  cob: ['A', 'K'],
  nmos: ['G', 'S', 'D'],
  pmos: ['G', 'S', 'D'],
  buck: ['BST', 'GND', 'FB', 'EN', 'IN', 'SW'],
  ldo: ['GND', 'OUT', 'IN', 'TAB'],
  mcu: ['VDD', 'GND'],
  charger: ['VBUS', 'GND', 'BAT', 'STAT', 'NC5', 'NC6'],
  retimer: ['VCC', 'GND'],
  amp: ['VDD', 'GND'],
  boost: ['VIN', 'GND'],
  shifter: ['VA', 'GND', 'A', 'B', 'VB', 'EN'],
  jack: ['TIP', 'SLEEVE'],
  connector: ['1', '2'],
  battery: ['+', '-'],
  module: ['1', '2'],
  button: ['1', '2'],
  testpoint: ['1'],
  logic: ['VCC', 'GND'],
  stick: ['VCC', 'GND', 'X', 'Y'],
};

/** Pin names of a part in footprint pad order. */
export function pinsOf(p: PartSpec): string[] {
  return p.pins ?? PIN_NAMES[p.kind];
}

/** Kinds whose orientation matters when installing. */
export const POLARIZED: Kind[] = ['electrolytic', 'diode', 'tvs', 'zener', 'led', 'cob'];

/** Processors, video/audio chips and game ROMs of the retro consoles (built from three templates). */
function handheldCpu(partNo: string, label: string, marking: string, cost: number): PartSpec {
  return {
    partNo,
    kind: 'mcu',
    pkg: 'QFP16',
    value: 3,
    label,
    marking,
    cost,
    pins: ['VDD', 'RST', 'CE', 'DIN', 'LED', 'VEN', 'SND', 'NC8', 'NC9', 'NC10', 'NC11', 'NC12', 'NC13', 'NC14', 'NC15', 'GND'],
    description: `${label}: reads the cartridge (DIN), sends the picture to the screen (VEN) and turns the speaker amp on (SND).`,
  };
}

function retroChips(): Record<string, PartSpec> {
  const cpu = (partNo: string, label: string, marking: string, cost: number, extraIn: string[] = []): PartSpec => ({
    partNo,
    kind: 'mcu',
    pkg: 'DIP40',
    value: 5,
    rating: 6,
    label,
    marking,
    cost,
    pins: dipPins(40, { 1: 'RST', 2: 'CE', 3: 'DIN', 4: 'LED', 5: 'VEN', ...Object.fromEntries(extraIn.map((n, i) => [6 + i, n])), 20: 'GND', 40: 'VDD' }),
    description: `${label}: runs the console. Reads the game from the cartridge (DIN) and tells the video chip to draw (VEN)${extraIn.length ? ` — but only once ${extraIn.join(', ')} is high` : ''}.`,
  });
  const video = (partNo: string, label: string, marking: string, cost: number, vmin = 4.2): PartSpec => ({
    partNo,
    kind: 'logic',
    pkg: 'DIP40',
    value: 5,
    label,
    marking,
    cost,
    pins: dipPins(40, { 1: 'VEN', 2: 'VID', 20: 'GND', 40: 'VCC' }),
    logic: { vcc: 'VCC', vmin, iq: 0.05, ch: [{ needHigh: ['VEN'], outs: ['VID'] }] },
    description: `${label}: draws the picture (VID) when the CPU says so (VEN).`,
  });
  const rom = (partNo: string, label: string, vmin = 4.2): PartSpec => ({
    partNo,
    kind: 'logic',
    pkg: 'DIP28',
    value: 5,
    label,
    marking: label.toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
    cost: 0,
    pins: dipPins(28, { 1: 'CE', 2: 'DO', 14: 'GND', 28: 'VCC' }),
    logic: { vcc: 'VCC', vmin, iq: 0.02, ch: [{ needHigh: ['CE'], outs: ['DO'] }] },
    description: 'The game itself, burned in at the factory. Nobody sells these: a dead one only comes from a donor cartridge of the same game.',
  });
  return {
    'U-B64-CPU': cpu('U-B64-CPU', 'B64 CPU', 'NUS-CPU-ish', 22, ['RAMOK']),
    'U-B64-RCP': video('U-B64-RCP', 'B64 reality chip', 'RCP-NUS', 26, 3.0),
    'U-VGA-CPU': cpu('U-VGA-CPU', 'Vega CPU', 'VG68000', 14),
    'U-VGA-VDP': video('U-VGA-VDP', 'Vega video chip (VDP)', 'VG-VDP', 15),
    'U-VGA-AUD': {
      partNo: 'U-VGA-AUD',
      kind: 'logic',
      pkg: 'DIP16',
      value: 5,
      label: 'Vega sound chip + amp',
      marking: 'VG-FM',
      cost: 6,
      pins: dipPins(16, { 1: 'AEN', 2: 'AOUT', 8: 'GND', 16: 'VCC' }),
      logic: { vcc: 'VCC', vmin: 4.2, iq: 0.02, ch: [{ needHigh: ['AEN'], outs: ['AOUT'] }] },
      description: 'Makes the music and sound effects (AOUT to the audio jack) while a game runs.',
    },
    'U-PAL-CPU': cpu('U-PAL-CPU', 'Paltari CPU', 'PL6507', 9),
    'U-PAL-TIA': video('U-PAL-TIA', 'Paltari TIA video chip', 'PL-TIA', 12),
    'U-ROM-B64': rom('U-ROM-B64', 'B64 game ROM'),
    'U-ROM-VGA': rom('U-ROM-VGA', 'Vega game ROM'),
    'U-ROM-PAL': rom('U-ROM-PAL', 'Paltari game ROM'),
    'U-ROM-DB': rom('U-ROM-DB', 'Dream Boy game ROM', 2.4),
    'U-ROM-DBA': rom('U-ROM-DBA', 'Dream Boy Advance game ROM', 2.4),
    'U-DB-CPU': handheldCpu('U-DB-CPU', 'Dream Boy CPU', 'DMG-CPU', 12),
    'U-DBC-CPU': handheldCpu('U-DBC-CPU', 'Dream Boy Color CPU', 'CGB-CPU', 16),
    'U-DBA-CPU': handheldCpu('U-DBA-CPU', 'Dream Boy Advance CPU', 'AGB-CPU', 20),
    'M-DBLCD': {
      partNo: 'M-DBLCD',
      kind: 'logic',
      pkg: 'SCREEN_S',
      value: 3,
      label: 'Handheld LCD module',
      marking: '',
      cost: 14,
      plugIn: true,
      pins: ['VCC', 'DATA', 'GND'],
      logic: { vcc: 'VCC', vmin: 2.4, iq: 0.012, ch: [] },
      description: 'Reflective LCD with its ribbon. Needs its supply (VCC) and the picture data (DATA) from the CPU.',
    },
  };
}

/** Handheld SoCs (donor-only), screens that report OK, Wi-Fi boards and cameras. */
function handheldParts(): Record<string, PartSpec> {
  const soc = (partNo: string, label: string, marking: string, cost: number): PartSpec => ({
    partNo,
    kind: 'mcu',
    pkg: 'QFP16',
    value: 3.3,
    label,
    marking,
    cost,
    pins: ['VDD', 'PWR', 'BA', 'DIN', 'LED', 'VEN', 'SND', 'EN', 'OK1', 'OK2', 'OK3', 'OK4', 'CE', 'DP', 'BB', 'GND'],
    description: `${label}: the main chip. Starts when the power button is pressed, checks its screens and boards (OK lines), then draws the picture (VEN) and plays sound (SND). Factory-programmed — donor boards only.`,
  });
  const modConn = (partNo: string, label: string, pins: string[]): PartSpec => ({ partNo, kind: 'connector', pkg: 'FPC4', value: 0, label, marking: '', cost: 0.6, heatLimit: 260, pins, description: `${label} (flip-latch ribbon connector).` });
  return {
    'U-BTL-SOC': soc('U-BTL-SOC', 'Button Lite SoC', 'HDH-CPU', 45),
    'U-RB35-SOC': soc('U-RB35-SOC', 'Retrobit SoC', 'RB-A7', 12),
    'U-RP-APU': soc('U-RP-APU', 'Rogue Pal APU', 'RP-Z1', 85),
    'U-DUO-SOC': soc('U-DUO-SOC', 'DuoScreen SoC', 'TWL-CPU', 40),
    'U-GNC-CPU': soc('U-GNC-CPU', 'Game & Clock CPU', 'GC-4BIT', 30),
    'U-CRT-CPU': soc('U-CRT-CPU', 'Critter Mini CPU', 'CRT-MCU', 60),
    'M-HHLCD': {
      partNo: 'M-HHLCD',
      kind: 'logic',
      pkg: 'SCREEN_M',
      value: 3.3,
      label: 'Screen module',
      marking: '',
      cost: 18,
      plugIn: true,
      pins: ['VCC', 'DATA', 'OK', 'GND'],
      logic: { vcc: 'VCC', vmin: 2.6, iq: 0.03, ch: [{ outs: ['OK'] }] },
      description: 'LCD + backlight module on a ribbon. Reports OK to the main chip once powered; shows a picture when it gets picture data (DATA).',
    },
    'M-WIFIB': {
      partNo: 'M-WIFIB',
      kind: 'logic',
      pkg: 'TPAD',
      value: 3.3,
      label: 'Wi-Fi board',
      marking: 'WIFI',
      cost: 7,
      plugIn: true,
      pins: ['VCC', 'EN', 'OK', 'GND'],
      logic: { vcc: 'VCC', vmin: 2.6, iq: 0.02, ch: [{ needHigh: ['EN'], outs: ['OK'] }] },
      description: 'Plug-in Wi-Fi board. The main chip will not finish booting if it does not answer.',
    },
    'M-CAM': {
      partNo: 'M-CAM',
      kind: 'logic',
      pkg: 'TPAD',
      value: 3.3,
      label: 'Camera + ribbon',
      marking: 'CAM',
      cost: 6,
      plugIn: true,
      pins: ['VCC', 'EN', 'OK', 'GND'],
      logic: { vcc: 'VCC', vmin: 2.6, iq: 0.01, ch: [{ needHigh: ['EN'], outs: ['OK'] }] },
      description: 'Camera module with its long hinge ribbon. A damaged ribbon can short the camera-ready line and stop the screens.',
    },
    'M-HHLCD35': {
      partNo: 'M-HHLCD35',
      kind: 'logic',
      pkg: 'SCREEN_L',
      value: 3.3,
      label: '3.5" IPS screen module (4:3)',
      marking: '',
      cost: 16,
      plugIn: true,
      pins: ['VCC', 'DATA', 'OK', 'GND'],
      logic: { vcc: 'VCC', vmin: 2.6, iq: 0.03, ch: [{ outs: ['OK'] }] },
      description: '3.5-inch 640 × 480 IPS panel on a 54-pin ZIF ribbon. Reports OK once powered; shows a picture when it gets picture data.',
    },
    'M-HHLCDW': {
      partNo: 'M-HHLCDW',
      kind: 'logic',
      pkg: 'SCREEN_W',
      value: 3.3,
      label: 'Wide screen module (5.5")',
      marking: '',
      cost: 32,
      plugIn: true,
      pins: ['VCC', 'DATA', 'OK', 'GND'],
      logic: { vcc: 'VCC', vmin: 2.6, iq: 0.05, ch: [{ outs: ['OK'] }] },
      description: 'Wide-screen LCD + touch module on its ribbon. Reports OK once powered; shows a picture when it gets picture data.',
    },
    'J-FPC-LCD': modConn('J-FPC-LCD', 'Screen ribbon connector', ['VCC', 'DATA', 'OK', 'GND']),
    'J-FPC-MOD': modConn('J-FPC-MOD', 'Board ribbon connector', ['VCC', 'EN', 'OK', 'GND']),
  };
}
