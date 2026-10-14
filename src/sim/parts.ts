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
  | 'testpoint';

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
  | 'TP';

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
   * Extra supply rails of a big chip (processor, SoC). The chip only boots when every rail is
   * above its UVLO; each rail draws `amps` while the chip runs and `standbyAmps` otherwise.
   */
  rails?: ChipRail[];
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
  'U-PIC8-SPK': { partNo: 'U-PIC8-SPK', kind: 'mcu', pkg: 'SOIC8', value: 3.3, label: 'Picoroo P8 MCU (speaker fw)', marking: 'P8-S40', cost: 3.5, pins: mcuPins('LED', 'AMPEN', 'BTN', 'CHG', 'NC6', 'NC7'), description: 'Picoroo P8 with factory-programmed Bluetooth-speaker firmware. Pinout: 1 VDD, 2 LED, 3 AMP_EN, 4 BTN, 5 CHG (charge status in), 8 GND.' },
  'U-PIC8-SBX': { partNo: 'U-PIC8-SBX', kind: 'mcu', pkg: 'SOIC8', value: 3.3, label: 'Picoroo P8 MCU (standby fw)', marking: 'P8-X1S', cost: 3.5, pins: mcuPins('LED', 'MAINEN', 'BTN', 'PG', 'NC6', 'NC7'), description: 'Picoroo P8 with factory-programmed console standby/power-sequencing firmware. Turns the main 12 V on when the power button is pressed and shuts it off again if PG (power good) does not come up. Pinout: 1 VDD, 2 LED, 3 MAIN_EN, 4 BTN, 5 PG, 8 GND.' },
  'U-APU-F5': {
    partNo: 'U-APU-F5',
    kind: 'mcu',
    pkg: 'QFP16',
    value: 3.3,
    label: 'Funstation 5 APU',
    marking: 'FS5-APU',
    cost: 95,
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
};

/** Pin names of a part in footprint pad order. */
export function pinsOf(p: PartSpec): string[] {
  return p.pins ?? PIN_NAMES[p.kind];
}

/** Kinds whose orientation matters when installing. */
export const POLARIZED: Kind[] = ['electrolytic', 'diode', 'tvs', 'zener', 'led', 'cob'];
