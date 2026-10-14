"""
Bench Tech parts library.

Run headless:  blender -b --factory-startup -P tools/blender/build_parts.py -- public/models/parts.glb

Units are millimetres (1 Blender unit = 1 mm). Every item is an Empty named
after the item (e.g. "pkg_SOT23", "tool_multimeter") at the origin with mesh
children. Board-layout coordinates (x right, y down) are converted with L().
Children with special names are driven at runtime:
  *_lens   emissive LED surface        *_cap    tact switch plunger
  *_lcd    instrument display          *_dial   rotary selector
"""

import math
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT = argv[0] if argv else "parts.glb"

# ---------------------------------------------------------------------------
# Scene + materials
# ---------------------------------------------------------------------------

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

_mats = {}


def mat(name, color, metallic=0.0, roughness=0.5, emissive=None):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emissive:
        bsdf.inputs["Emission Color"].default_value = (*emissive, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 0.0
    _mats[name] = m
    return m


def srgb(h):
    """Hex sRGB -> linear tuple."""
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


M = {
    "black": mat("epoxy_black", srgb("3d3f44"), 0.0, 0.62),
    "body_res": mat("res_body", srgb("34363a"), 0.0, 0.6),
    "ceramic": mat("ceramic_tan", srgb("a7835a"), 0.0, 0.7),
    "tin": mat("tin", srgb("cfd2d4"), 0.45, 0.35),
    "gold": mat("gold", srgb("d4a94a"), 0.45, 0.35),
    "fuse": mat("fuse_body", srgb("e8e2cf"), 0.0, 0.6),
    "band": mat("band_grey", srgb("c4c6ca"), 0.0, 0.55),
    "led_base": mat("led_base", srgb("f2f0ea"), 0.0, 0.4),
    "lens_green": mat("lens_green", srgb("b7e8b0"), 0.0, 0.15, emissive=srgb("39ff4a")),
    "lens_blue": mat("lens_blue", srgb("b9d4f5"), 0.0, 0.15, emissive=srgb("3a7bff")),
    "lens_white": mat("lens_cob", srgb("f2d65a"), 0.0, 0.35, emissive=srgb("fff4d6")),
    "alu": mat("aluminium", srgb("c3c7cc"), 0.35, 0.4),
    "alu_dark": mat("alu_dark", srgb("4a4e55"), 0.3, 0.5),
    "ferrite": mat("ferrite", srgb("55575c"), 0.2, 0.65),
    "plastic_dark": mat("plastic_dark", srgb("44464b"), 0.0, 0.6),
    "steel": mat("steel", srgb("b8bcc2"), 0.45, 0.3),
    "red": mat("plastic_red", srgb("c8202a"), 0.0, 0.45),
    "redbright": mat("plastic_red_bright", srgb("e0303a"), 0.0, 0.35),
    "blackplastic": mat("plastic_black", srgb("35373c"), 0.0, 0.5),
    "yellow": mat("rubber_yellow", srgb("f2b81c"), 0.0, 0.75),
    "face": mat("face_dark", srgb("2a2c30"), 0.0, 0.5),
    "lcd": mat("lcd", srgb("9fae8f"), 0.0, 0.3, emissive=srgb("b6c7a4")),
    "psu": mat("psu_case", srgb("d9dadc"), 0.2, 0.45),
    "psu_face": mat("psu_face", srgb("2e3136"), 0.0, 0.5),
    "psu_disp": mat("psu_display", srgb("101418"), 0.0, 0.2, emissive=srgb("ff5a3c")),
    "wood": mat("bench_wood", srgb("9a7652"), 0.0, 0.65),
    "mat": mat("esd_mat", srgb("3d5a6e"), 0.0, 0.85),
    "matgrid": mat("esd_grid", srgb("5d7a8e"), 0.0, 0.85),
    "iron_handle": mat("iron_handle", srgb("2d6ec9"), 0.0, 0.5),
    "rubber": mat("rubber_black", srgb("2c2d30"), 0.0, 0.85),
    "lens_red": mat("lens_red", srgb("f0b0b0"), 0.0, 0.15, emissive=srgb("ff3a2a")),
    "lens_wled": mat("lens_wled", srgb("f4f1df"), 0.0, 0.15, emissive=srgb("fff6e6")),
    "nylon": mat("nylon_white", srgb("e9e4d6"), 0.0, 0.55),
    "fpc": mat("fpc_amber", srgb("c7862a"), 0.0, 0.4),
    "battwrap": mat("batt_wrap", srgb("2f5f9e"), 0.0, 0.45),
    "glass": mat("lcd_glass", srgb("16191d"), 0.1, 0.1, emissive=srgb("dfe8ff")),
    "bezel": mat("bezel_black", srgb("222326"), 0.0, 0.5),
    "cone": mat("speaker_cone", srgb("1d1e21"), 0.0, 0.9),
    "stripbody": mat("led_strip", srgb("f3f3f0"), 0.0, 0.5),
    "wire_red": mat("wire_red", srgb("c81e22"), 0.0, 0.5),
    "wire_black": mat("wire_black", srgb("1c1c1e"), 0.0, 0.5),
}

# ---------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------


def L(x, y, z=0.0):
    """Board layout (x right, y down, z up) -> Blender (x, -y, z)."""
    return (x, -y, z)


def _link(name, mesh, parent, material, bevel=0.0, segments=2):
    ob = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(ob)
    ob.parent = parent
    if material:
        ob.data.materials.append(material)
    if bevel > 0:
        mod = ob.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = segments
        mod.limit_method = "ANGLE"
    for p in ob.data.polygons:
        p.use_smooth = segments > 1 and bevel > 0
    return ob


def box(name, parent, material, cx, cy, z0, w, h, d, bevel=0.0, segments=2):
    """Axis-aligned box in layout space: centre (cx, cy), bottom at z0, size w×h×d."""
    x0, x1 = cx - w / 2, cx + w / 2
    y0, y1 = cy - h / 2, cy + h / 2
    z1 = z0 + d
    vs = [L(x, y, z) for z in (z0, z1) for y in (y0, y1) for x in (x0, x1)]
    fs = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(vs, [], fs)
    me.validate()
    _box_uvs(me, x0, y0, z0, w, h, d)
    return _link(name, me, parent, material, bevel, segments)


def _box_uvs(me, x0, y0, z0, w, h, d):
    """Planar UVs per face so canvas textures (instrument displays) map 0..1 across each face."""
    uv = me.uv_layers.new(name="UVMap")
    for poly in me.polygons:
        nx, ny, nz = (abs(c) for c in poly.normal)
        for li in poly.loop_indices:
            bx, by, bz = me.vertices[me.loops[li].vertex_index].co
            x, y, z = bx, -by, bz  # back to layout space
            if nz >= nx and nz >= ny:
                u, v = (x - x0) / w, 1 - (y - y0) / h
            elif ny >= nx:
                u, v = (x - x0) / w, (z - z0) / d
            else:
                u, v = (y - y0) / h, (z - z0) / d
            uv.data[li].uv = (u, v)


def cyl(name, parent, material, cx, cy, z0, r, d, n=32, axis="z", r2=None, smooth=True):
    """Cylinder (or cone if r2) in layout space. axis 'z' vertical, 'x' along board x."""
    r2 = r if r2 is None else r2
    vs = []
    for k, (rr, t) in enumerate(((r, 0.0), (r2, d))):
        for i in range(n):
            a = 2 * math.pi * i / n
            u, v = rr * math.cos(a), rr * math.sin(a)
            if axis == "z":
                vs.append(L(cx + u, cy + v, z0 + t))
            elif axis == "y":  # starts at cy, extends towards the player (+y)
                vs.append(L(cx + u, cy + t, z0 + v))
            else:  # axis x: starts at cx, extends +x
                vs.append(L(cx + t, cy + u, z0 + v))
    fs = [tuple(range(n))[::-1], tuple(range(n, 2 * n))]
    if axis != "z":
        fs = [tuple(range(n)), tuple(range(n, 2 * n))[::-1]]
    for i in range(n):
        j = (i + 1) % n
        fs.append((i, j, n + j, n + i) if axis == "z" else (i, n + i, n + j, j))
    if axis == "y":  # mirrored handedness vs. axis x
        fs = [f[::-1] for f in fs]
    me = bpy.data.meshes.new(name)
    me.from_pydata(vs, [], fs)
    me.validate()
    ob = _link(name, me, parent, material)
    for i, p in enumerate(ob.data.polygons):
        p.use_smooth = smooth and i >= 2
    return ob


def item(name):
    e = bpy.data.objects.new(name, None)
    scene.collection.objects.link(e)
    return e


# ---------------------------------------------------------------------------
# SMD packages (pins along x, see src/sim/footprints.ts)
# ---------------------------------------------------------------------------


def chip(name, w, h, t, body_mat, cap_w):
    e = item(name)
    box(f"{name}_body", e, body_mat, 0, 0, 0.02, w - 2 * cap_w + 0.02, h, t, bevel=0.03)
    for s in (-1, 1):
        box(f"{name}_term{s}", e, M["tin"], s * (w / 2 - cap_w / 2), 0, 0.0, cap_w, h * 1.02, t * 1.04, bevel=0.04)
    return e


chip("pkg_0603_res", 1.6, 0.8, 0.45, M["body_res"], 0.3)
chip("pkg_0603_cap", 1.6, 0.8, 0.8, M["ceramic"], 0.3)
chip("pkg_1206_res", 3.2, 1.6, 0.55, M["body_res"], 0.5)
chip("pkg_1206_cap", 3.2, 1.6, 1.1, M["ceramic"], 0.5)
chip("pkg_1206_fuse", 3.2, 1.6, 0.8, M["fuse"], 0.5)


def led(name, lens_mat):
    e = item(name)
    box(f"{name}_base", e, M["led_base"], 0, 0, 0.02, 1.5, 1.25, 0.45, bevel=0.05)
    for s in (-1, 1):
        box(f"{name}_term{s}", e, M["gold"], s * 0.85, 0, 0.0, 0.3, 1.25, 0.5)
    box(f"{name}_lens", e, lens_mat, 0, 0, 0.47, 1.3, 1.05, 0.33, bevel=0.15, segments=4)
    # cathode mark (green tick on the +x side of the base)
    box(f"{name}_mark", e, M["lens_green"], 0.55, 0.5, 0.47, 0.2, 0.15, 0.02)
    return e


led("pkg_LED0805_green", M["lens_green"])
led("pkg_LED0805_blue", M["lens_blue"])
led("pkg_LED0805_red", M["lens_red"])
led("pkg_LED0805_white", M["lens_wled"])


def diode_pkg(name, w, h, t, lead_w):
    e = item(name)
    box(f"{name}_body", e, M["black"], 0, 0, 0.15, w - 0.4, h, t - 0.15, bevel=0.12)
    box(f"{name}_band", e, M["band"], w / 2 - 0.75, 0, t + 0.001, 0.45, h * 0.98, 0.01)
    for s in (-1, 1):
        box(f"{name}_lead{s}", e, M["tin"], s * (w / 2 - 0.15), 0, 0.0, 0.7, lead_w, 0.2)
    return e


diode_pkg("pkg_SMA", 4.3, 2.6, 2.1, 1.5)
diode_pkg("pkg_SOD123", 2.7, 1.6, 1.1, 0.6)


def gullwing(name, parent, x, y, out_y, w=0.4):
    """Lead from body edge (y) outward to the pad (out_y)."""
    mid = (y + out_y) / 2
    length = abs(out_y - y)
    box(name + "_up", parent, M["tin"], x, y + (out_y - y) * 0.15, 0.35, w, length * 0.35, 0.15)
    box(name + "_foot", parent, M["tin"], x, out_y - (out_y - y) * 0.2, 0.0, w, length * 0.55, 0.15)
    box(name + "_drop", parent, M["tin"], x, mid, 0.0, w, 0.15, 0.5)


def sot23():
    n = "pkg_SOT23"
    e = item(n)
    box(f"{n}_body", e, M["black"], 0, 0, 0.1, 2.9, 1.3, 0.9, bevel=0.08)
    gullwing(f"{n}_l1", e, -0.95, 0.65, 1.25)
    gullwing(f"{n}_l2", e, 0.95, 0.65, 1.25)
    gullwing(f"{n}_l3", e, 0, -0.65, -1.25)


def sot23_6():
    n = "pkg_SOT23-6"
    e = item(n)
    box(f"{n}_body", e, M["black"], 0, 0, 0.1, 2.9, 1.6, 1.0, bevel=0.08)
    cyl(f"{n}_dot", e, M["band"], -1.05, 0.45, 1.1, 0.15, 0.01, n=12)
    for x in (-0.95, 0, 0.95):
        gullwing(f"{n}_b{x}", e, x, 0.8, 1.4)
        gullwing(f"{n}_t{x}", e, x, -0.8, -1.4)


def sot223():
    n = "pkg_SOT223"
    e = item(n)
    box(f"{n}_body", e, M["black"], 0, 0, 0.1, 6.5, 3.5, 1.5, bevel=0.1)
    for x in (-2.3, 0, 2.3):
        gullwing(f"{n}_l{x}", e, x, 1.75, 3.6, w=0.7)
    box(f"{n}_tab", e, M["tin"], 0, -2.6, 0.0, 3.0, 1.9, 0.25)


def soic8():
    n = "pkg_SOIC8"
    e = item(n)
    box(f"{n}_body", e, M["black"], 0, 0, 0.1, 3.9, 4.9, 1.4, bevel=0.1)
    cyl(f"{n}_dot", e, M["band"], -1.2, -1.8, 1.5, 0.3, 0.01, n=16)
    for y in (-1.905, -0.635, 0.635, 1.905):
        for s in (-1, 1):
            # rotate the gull-wing helper: leads run along x here
            box(f"{n}_l{s}{y}_up", e, M["tin"], s * 2.1, y, 0.35, 0.35, 0.42, 0.15)
            box(f"{n}_l{s}{y}_drop", e, M["tin"], s * 2.35, y, 0.0, 0.15, 0.42, 0.5)
            box(f"{n}_l{s}{y}_foot", e, M["tin"], s * 2.75, y, 0.0, 0.8, 0.42, 0.15)


sot23()
sot23_6()
sot223()
soic8()


def cap_el():
    n = "pkg_CAP_EL"
    e = item(n)
    box(f"{n}_base", e, M["plastic_dark"], 0, 0, 0.0, 6.6, 6.6, 1.0, bevel=0.3)
    cyl(f"{n}_can", e, M["alu"], 0, 0, 1.0, 3.15, 4.6, n=48)
    cyl(f"{n}_top", e, M["alu"], 0, 0, 5.6, 3.15, 0.2, n=48, r2=2.9)
    # negative-side stripe (pin "-" is at +x)
    box(f"{n}_stripe", e, M["plastic_dark"], 2.45, 0, 5.79, 1.3, 3.8, 0.02)
    box(f"{n}_vent1", e, M["alu_dark"], 0, 0, 5.8, 3.6, 0.15, 0.02)
    box(f"{n}_vent2", e, M["alu_dark"], 0, 0, 5.8, 0.15, 3.6, 0.02)
    for s in (-1, 1):
        box(f"{n}_pin{s}", e, M["tin"], s * 3.0, 0, 0.0, 1.6, 0.8, 0.2)


def inductor():
    n = "pkg_IND5"
    e = item(n)
    box(f"{n}_body", e, M["ferrite"], 0, 0, 0.1, 5.0, 5.0, 2.9, bevel=0.6, segments=3)
    cyl(f"{n}_core", e, M["alu_dark"], 0, 0, 3.0, 1.2, 0.02, n=24)
    for s in (-1, 1):
        box(f"{n}_term{s}", e, M["tin"], s * 2.1, 0, 0.0, 1.0, 3.6, 0.25)


def barrel():
    n = "pkg_BARREL"
    e = item(n)
    box(f"{n}_body", e, M["blackplastic"], 0, 0, 0.0, 12, 9, 11, bevel=0.4)
    # socket opening faces -x (board edge)
    cyl(f"{n}_rim", e, M["plastic_dark"], -6.05, 0, 6.0, 3.6, 0.1, axis="x")
    cyl(f"{n}_hole", e, mat("socket_void", srgb("050505"), 0.0, 1.0), -6.06, 0, 6.0, 2.9, 0.12, axis="x")
    cyl(f"{n}_pin", e, M["tin"], -6.2, 0, 6.0, 1.0, 9.0, n=16, axis="x")
    for y in (-1.8, 2.8):
        box(f"{n}_tab{y}", e, M["tin"], 6.8, y, 0.0, 1.6, 0.4, 3.0)


def tact():
    n = "pkg_TACT6"
    e = item(n)
    box(f"{n}_base", e, M["blackplastic"], 0, 0, 0.0, 6, 6, 2.4, bevel=0.15)
    box(f"{n}_plate", e, M["steel"], 0, 0, 2.4, 6, 6, 0.3)
    cyl(f"{n}_cap", e, M["blackplastic"], 0, 0, 2.7, 1.75, 1.3, n=32)
    for s in (-1, 1):
        for y in (-2.25, 2.25):
            box(f"{n}_leg{s}{y}", e, M["tin"], s * 3.6, y, 0.0, 1.4, 0.7, 0.3)


def cob():
    n = "pkg_COB"
    e = item(n)
    box(f"{n}_pcb", e, M["alu"], 0, 0, 0.0, 10, 10, 0.8, bevel=0.2)
    cyl(f"{n}_ring", e, M["led_base"], 0, 0, 0.8, 4.0, 0.3, n=48)
    cyl(f"{n}_lens", e, M["lens_white"], 0, 0, 0.82, 3.5, 0.32, n=48)
    for s in (-1, 1):
        box(f"{n}_pad{s}", e, M["tin"], s * 4.2, 3.6, 0.8, 1.2, 1.2, 0.05)



# ---------------------------------------------------------------------------
# Bigger silicon, connectors and plug-in modules (see footprints.ts)
# ---------------------------------------------------------------------------


def qfp16():
    n = "pkg_QFP16"
    e = item(n)
    box(f"{n}_body", e, M["black"], 0, 0, 0.1, 7.0, 7.0, 1.3, bevel=0.12)
    cyl(f"{n}_dot", e, M["band"], -2.6, -2.6, 1.4, 0.35, 0.01, n=16)
    for k in (-2.25, -0.75, 0.75, 2.25):
        for s in (-1, 1):
            box(f"{n}_lx{s}{k}_up", e, M["tin"], s * 3.75, k, 0.45, 0.6, 0.3, 0.15)
            box(f"{n}_lx{s}{k}_drop", e, M["tin"], s * 4.0, k, 0.0, 0.15, 0.3, 0.6)
            box(f"{n}_lx{s}{k}_foot", e, M["tin"], s * 4.45, k, 0.0, 0.9, 0.3, 0.15)
            box(f"{n}_ly{s}{k}_up", e, M["tin"], k, s * 3.75, 0.45, 0.3, 0.6, 0.15)
            box(f"{n}_ly{s}{k}_drop", e, M["tin"], k, s * 4.0, 0.0, 0.3, 0.15, 0.6)
            box(f"{n}_ly{s}{k}_foot", e, M["tin"], k, s * 4.45, 0.0, 0.3, 0.9, 0.15)


def dpak():
    n = "pkg_DPAK"
    e = item(n)
    box(f"{n}_tab", e, M["tin"], 0, -1.6, 0.0, 5.4, 5.0, 0.5)
    box(f"{n}_body", e, M["black"], 0, 0.4, 0.1, 6.0, 5.6, 2.2, bevel=0.12)
    for x in (-2.28, 2.28):
        box(f"{n}_lead{x}", e, M["tin"], x, 4.4, 0.0, 0.8, 2.6, 0.3)
        box(f"{n}_leadup{x}", e, M["tin"], x, 3.3, 0.3, 0.8, 0.4, 0.6)


def cap_el10():
    n = "pkg_CAP_EL10"
    e = item(n)
    box(f"{n}_base", e, M["plastic_dark"], 0, 0, 0.0, 10.3, 10.3, 1.2, bevel=0.4)
    cyl(f"{n}_can", e, M["alu"], 0, 0, 1.2, 5.0, 9.0, n=56)
    cyl(f"{n}_top", e, M["alu"], 0, 0, 10.2, 5.0, 0.25, n=56, r2=4.7)
    box(f"{n}_stripe", e, M["plastic_dark"], 3.9, 0, 10.45, 2.0, 6.0, 0.02)
    box(f"{n}_vent1", e, M["alu_dark"], 0, 0, 10.46, 6.0, 0.2, 0.02)
    box(f"{n}_vent2", e, M["alu_dark"], 0, 0, 10.46, 0.2, 6.0, 0.02)
    for s in (-1, 1):
        box(f"{n}_pin{s}", e, M["tin"], s * 4.4, 0, 0.0, 2.4, 1.2, 0.25)


VOID = mat("socket_void", srgb("050505"), 0.0, 1.0)


def shell_port(n, w, h, height, mouth_w, mouth_h, tongue=None):
    """Metal-shell receptacle, mouth at -y (board edge), pins at +y."""
    e = item(n)
    box(f"{n}_shell", e, M["steel"], 0, 0, 0.0, w, h, height, bevel=min(0.6, height / 4), segments=3)
    box(f"{n}_mouth", e, VOID, 0, -h / 2 - 0.01, (height - mouth_h) / 2, mouth_w, 0.05, mouth_h)
    if tongue:
        box(f"{n}_tongue", e, M[tongue], 0, -h / 2 + 0.6, height / 2 - 0.35, mouth_w * 0.7, 1.6, 0.7)
    for s in (-1, 1):
        box(f"{n}_tab{s}", e, M["steel"], s * (w / 2 + 0.2), h / 2 - 1.2, 0.0, 0.6, 1.6, 0.6)
    return e


def usbc():
    e = shell_port("pkg_USBC", 9.0, 7.3, 3.2, 8.0, 2.4, tongue="blackplastic")
    for i, x in enumerate((-1.75, 0.25, 1.75)):
        box(f"pkg_USBC_pin{i}", e, M["gold"], x, 3.95, 0.0, 0.4, 1.0, 0.15)


def musb():
    e = shell_port("pkg_MUSB", 7.5, 5.0, 2.6, 6.6, 1.8, tongue="blackplastic")
    for i, x in enumerate((-1.3, -0.65, 0, 0.65, 1.3)):
        box(f"pkg_MUSB_pin{i}", e, M["gold"], x, 2.75, 0.0, 0.25, 1.0, 0.15)


def hdmi():
    n = "pkg_HDMI"
    e = item(n)
    box(f"{n}_shell", e, M["steel"], 0, 0, 0.0, 15.0, 11.0, 5.6, bevel=0.5, segments=3)
    box(f"{n}_mouth", e, VOID, 0, -5.51, 1.6, 13.6, 0.05, 3.2)
    box(f"{n}_mouth2", e, VOID, 0, -5.51, 4.6, 14.2, 0.05, 0.4)
    box(f"{n}_tongue", e, M["blackplastic"], 0, -4.6, 2.6, 10.5, 2.0, 1.2)
    for i, x in enumerate((-4.5, -3, -1.5, 0, 1.5, 3, 4.5)):
        box(f"{n}_pin{i}", e, M["gold"], x, 5.9, 0.0, 0.35, 1.4, 0.15)
    for s in (-1, 1):
        box(f"{n}_leg{s}", e, M["steel"], s * 7.6, 2.0, 0.0, 0.9, 2.4, 0.8)


def pwr2():
    n = "pkg_PWR2"
    e = item(n)
    box(f"{n}_body", e, M["nylon"], 0, 0, 0.0, 10.0, 6.0, 9.0, bevel=0.3)
    for s in (-1, 1):
        box(f"{n}_cav{s}", e, VOID, s * 2.5, -0.5, 8.99, 3.6, 3.6, 0.03)
        box(f"{n}_pin{s}", e, M["tin"], s * 2.5, 4.4, 0.0, 1.2, 1.2, 0.5)
    box(f"{n}_latch", e, M["nylon"], 0, -3.3, 5.0, 3.0, 0.8, 3.0)


def jst2():
    n = "pkg_JST2"
    e = item(n)
    box(f"{n}_body", e, M["nylon"], 0, 0, 0.0, 6.0, 4.5, 4.2, bevel=0.2)
    box(f"{n}_open", e, VOID, 0, -0.3, 4.19, 4.6, 3.2, 0.03)
    for s in (-1, 1):
        box(f"{n}_pin{s}", e, M["tin"], s, 2.9, 0.0, 0.6, 1.4, 0.2)


def fpc2():
    n = "pkg_FPC2"
    e = item(n)
    box(f"{n}_body", e, M["nylon"], 0, 0.4, 0.0, 8.0, 3.2, 1.2, bevel=0.1)
    box(f"{n}_latch", e, M["blackplastic"], 0, -1.6, 0.0, 8.4, 1.0, 1.5, bevel=0.1)
    for s in (-1, 1):
        box(f"{n}_pin{s}", e, M["gold"], s * 1.2, 2.5, 0.0, 0.35, 1.0, 0.12)


def batt():
    n = "pkg_BATT"
    e = item(n)
    box(f"{n}_cell", e, M["battwrap"], 0, 0, 0.0, 34, 20, 6, bevel=1.5, segments=4)
    box(f"{n}_label", e, M["band"], 0, 2, 6.0, 20, 9, 0.02)
    box(f"{n}_pcm", e, M["fpc"], 0, -9.3, 1.5, 12, 1.4, 3)
    box(f"{n}_wire_r", e, M["wire_red"], -0.8, -10.5, 0.0, 0.9, 2.5, 0.9)
    box(f"{n}_wire_b", e, M["wire_black"], 0.8, -10.5, 0.0, 0.9, 2.5, 0.9)


def screen():
    n = "pkg_SCREEN"
    e = item(n)
    box(f"{n}_frame", e, M["bezel"], 0, 0, 0.0, 44, 28, 2.6, bevel=0.6, segments=3)
    box(f"{n}_lens", e, M["glass"], 0, -1, 2.6, 39, 22, 0.15)
    box(f"{n}_ribbon", e, M["fpc"], 0, 13, 0.0, 9, 3, 0.2)


def spk():
    n = "pkg_SPK"
    e = item(n)
    cyl(f"{n}_frame", e, M["steel"], 0, 0, 0.0, 11, 4.0, n=56)
    cyl(f"{n}_cone", e, M["cone"], 0, 0, 4.0, 10, 2.0, n=56, r2=4)
    cyl(f"{n}_dust", e, M["cone"], 0, 0, 5.9, 3.6, 0.7, n=32, r2=2.6)
    box(f"{n}_wire_r", e, M["wire_red"], -0.8, -10.0, 0.0, 0.9, 2.5, 0.9)
    box(f"{n}_wire_b", e, M["wire_black"], 0.8, -10.0, 0.0, 0.9, 2.5, 0.9)


def ledbar():
    n = "pkg_LEDBAR"
    e = item(n)
    box(f"{n}_strip", e, M["stripbody"], 0, 0, 0.0, 60, 6, 1.0, bevel=0.2)
    for i in range(10):
        x = -24.3 + i * 5.4
        box(f"{n}_led{i}", e, M["led_base"], x, 0, 1.0, 3.2, 2.8, 0.7, bevel=0.1)
        box(f"{n}_led{i}_lens", e, M["lens_wled"], x, 0, 1.7, 2.6, 2.2, 0.15)


qfp16()
dpak()
cap_el10()
usbc()
musb()
hdmi()
pwr2()
jst2()
fpc2()
batt()
screen()
spk()
ledbar()


cap_el()
inductor()
barrel()
tact()
cob()

# ---------------------------------------------------------------------------
# Tools & bench (tool origins at the working point: probe tip, iron tip)
# ---------------------------------------------------------------------------


def probe(name, handle):
    """Probe lying along layout -y (tip at origin pointing +y), raised later at runtime."""
    e = item(name)
    cyl(f"{name}_needle", e, M["steel"], 0, 0, 0, 0.12, 14, n=12, axis="z", r2=0.55)
    cyl(f"{name}_collar", e, handle, 0, 0, 14, 2.2, 6, n=24, r2=3.4)
    cyl(f"{name}_guard", e, handle, 0, 0, 20, 5.2, 2.5, n=32)
    cyl(f"{name}_grip", e, handle, 0, 0, 22.5, 3.8, 75, n=32, r2=4.2)
    cyl(f"{name}_boot", e, M["rubber"], 0, 0, 97.5, 4.2, 12, n=32, r2=2.4)
    return e


probe("tool_probe_red", M["redbright"])
probe("tool_probe_black", M["blackplastic"])


def iron():
    n = "tool_iron"
    e = item(n)
    cyl(f"{n}_tip", e, M["steel"], 0, 0, 0, 0.25, 8, n=16, r2=1.4)
    cyl(f"{n}_shaft", e, M["steel"], 0, 0, 8, 2.2, 40, n=24)
    cyl(f"{n}_guard", e, M["rubber"], 0, 0, 48, 6.5, 8, n=32, r2=5)
    cyl(f"{n}_grip", e, M["rubber"], 0, 0, 56, 6, 60, n=32, r2=6.5)
    cyl(f"{n}_handle", e, M["iron_handle"], 0, 0, 116, 6.5, 50, n=32, r2=5)


def multimeter():
    n = "tool_multimeter"
    e = item(n)
    box(f"{n}_boot", e, M["yellow"], 0, 0, 0, 84, 168, 34, bevel=6, segments=4)
    box(f"{n}_face", e, M["face"], 0, 4, 34, 70, 150, 1.2, bevel=2)
    box(f"{n}_bezel", e, M["plastic_dark"], 0, -48, 35, 62, 36, 0.8, bevel=1.5)
    box(f"{n}_lcd", e, M["lcd"], 0, -48, 35.6, 54, 28, 0.4)
    cyl(f"{n}_dialring", e, M["plastic_dark"], 0, 18, 35, 24, 1.2, n=48)
    d = item(f"{n}_dial")
    d.parent = e
    d.location = L(0, 18, 36)
    cyl(f"{n}_dialknob", d, M["blackplastic"], 0, 0, 0, 20, 4, n=48)
    box(f"{n}_dialpointer", d, M["redbright"], 0, -13, 4, 3, 12, 1.5)
    box(f"{n}_dialgrip", d, M["plastic_dark"], 0, 0, 4, 6, 34, 4, bevel=1)
    for i, (x, m) in enumerate(((-22, M["blackplastic"]), (0, M["redbright"]), (22, M["redbright"]))):
        cyl(f"{n}_jackring{i}", e, m, x, 64, 35, 5, 1.5, n=24)
        cyl(f"{n}_jack{i}", e, M["steel"], x, 64, 35.2, 2.2, 1.5, n=16)


def psu():
    n = "tool_psu"
    e = item(n)
    box(f"{n}_case", e, M["psu"], 0, 0, 0, 150, 220, 140, bevel=3)
    # front panel faces +y (towards the player)
    box(f"{n}_panel", e, M["psu_face"], 0, 110.5, 4, 140, 1.5, 130, bevel=1)
    box(f"{n}_disp_v", e, M["psu_disp"], -30, 111.5, 90, 56, 1, 26)
    box(f"{n}_disp_a", e, M["psu_disp"], 30, 111.5, 90, 56, 1, 26)
    for i, x in enumerate((-30, 30)):
        cyl(f"{n}_knob{i}", e, M["blackplastic"], x, 111, 55, 11, 14, n=32, axis="y", r2=10)
        box(f"{n}_knobmark{i}", e, M["led_base"], x, 125.2, 61, 1.6, 0.4, 7)
    # binding posts: black, red, black (ground)
    for i, (x, m) in enumerate(((-40, M["blackplastic"]), (0, M["red"]), (40, M["blackplastic"]))):
        cyl(f"{n}_post{i}", e, m, x, 111, 22, 6, 9, n=24, axis="y")
        cyl(f"{n}_postcap{i}", e, m, x, 120, 22, 4.5, 3, n=24, axis="y")
    box(f"{n}_switch", e, M["redbright"], 55, 114, 20, 16, 6, 10, bevel=1)


def bench():
    n = "env_bench"
    e = item(n)
    box(f"{n}_top", e, M["wood"], 0, 0, -40, 1400, 800, 40, bevel=4)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(f"{n}_leg{sx}{sy}", e, M["wood"], sx * 640, sy * 350, -760, 60, 60, 720)
    box(f"{n}_mat", e, M["mat"], 0, 30, 0, 640, 440, 2, bevel=1)
    for i in range(-6, 7):
        box(f"{n}_gx{i}", e, M["matgrid"], i * 50, 30, 2, 0.8, 420, 0.1)
    for j in range(-4, 5):
        box(f"{n}_gy{j}", e, M["matgrid"], 0, 30 + j * 50, 2, 620, 0.8, 0.1)


iron()
multimeter()
psu()
bench()

# ---------------------------------------------------------------------------
# Enclosure items (src/sim/enclosures.ts). Panels are modelled at a nominal size
# and scaled per device at runtime: shell 100x100 mm, shield/heatsink/pad 10x10 mm,
# fan 30 mm. Screws, plugs, ribbons and stickers are real size.
# ---------------------------------------------------------------------------

M["shell"] = mat("case_plastic", srgb("f0f0ee"), 0.0, 0.35)
M["shieldsteel"] = mat("shield_tinplate", srgb("c9ced3"), 0.55, 0.32)
M["recess"] = mat("screw_recess", srgb("26282b"), 0.2, 0.6)
M["sticker"] = mat("sticker_foil", srgb("dde3e8"), 0.6, 0.25)


def enc_shell():
    n = "enc_shell"
    e = item(n)
    m = M["shell"]
    box(f"{n}_top", e, m, 0, 0, 14, 100, 100, 2, bevel=0.8)
    for sx in (-1, 1):
        box(f"{n}_wx{sx}", e, m, sx * 49, 0, 0, 2, 100, 14)
        box(f"{n}_wy{sx}", e, m, 0, sx * 49, 0, 100, 2, 14)


def enc_screw():
    n = "enc_screw"
    e = item(n)
    cyl(f"{n}_head", e, M["steel"], 0, 0, 0, 1.4, 0.45, n=24)
    cyl(f"{n}_dome", e, M["steel"], 0, 0, 0.45, 1.25, 0.3, n=24, r2=0.9)
    box(f"{n}_x", e, M["recess"], 0, 0, 0.6, 1.3, 0.28, 0.2)
    box(f"{n}_y", e, M["recess"], 0, 0, 0.6, 0.28, 1.3, 0.2)


def enc_shield():
    n = "enc_shield"
    e = item(n)
    m = M["shieldsteel"]
    box(f"{n}_plate", e, m, 0, 0, 0, 10, 10, 0.25)
    for sx in (-1, 1):
        box(f"{n}_sx{sx}", e, m, sx * 4.95, 0, -1.6, 0.1, 10, 1.6)
        box(f"{n}_sy{sx}", e, m, 0, sx * 4.95, -1.6, 10, 0.1, 1.6)
    # a raised stamped panel (scales cleanly with the shield)
    box(f"{n}_emboss", e, m, 0, 0, 0.25, 8.6, 8.6, 0.12, bevel=0.05)


def enc_heatsink():
    n = "enc_heatsink"
    e = item(n)
    m = M["alu"]
    box(f"{n}_base", e, m, 0, 0, 0, 10, 10, 1.2, bevel=0.1)
    for i in range(7):
        box(f"{n}_fin{i}", e, m, -4.5 + i * 1.5, 0, 1.2, 0.5, 10, 6)


def enc_fan():
    n = "enc_fan"
    e = item(n)
    k = M["blackplastic"]
    for sx in (-1, 1):
        box(f"{n}_fx{sx}", e, k, sx * 13.75, 0, 0, 2.5, 30, 8)
        box(f"{n}_fy{sx}", e, k, 0, sx * 13.75, 0, 30, 2.5, 8)
    cyl(f"{n}_ring", e, k, 0, 0, 0, 13.6, 0.8, n=40)
    cyl(f"{n}_hub", e, k, 0, 0, 0.8, 5.5, 7, n=32)
    cyl(f"{n}_label", e, M["sticker"], 0, 0, 7.8, 4, 0.05, n=32)
    for i in range(7):
        b = box(f"{n}_blade{i}", e, k, 0, 0, 2.5, 7.5, 2.4, 0.5)
        # blades: rotate each about the hub and tilt it
        b.data.transform(__import__("mathutils").Matrix.Translation((9, 0, 0)))
        b.rotation_euler = (0.35, 0, 2 * math.pi * i / 7)


def enc_plug():
    n = "enc_jst"
    e = item(n)
    box(f"{n}_body", e, M["nylon"], 0, 0, 0, 6, 4.2, 3.2, bevel=0.2)
    for i, w in enumerate((M["wire_red"], M["wire_black"])):
        cyl(f"{n}_w{i}", e, w, -1.2 + i * 2.4, 2.1, 1.6, 0.55, 12, n=12, axis="y")


def enc_ribbon():
    n = "enc_ribbon"
    e = item(n)
    box(f"{n}_flex", e, M["fpc"], 0, 3, 0.3, 8, 12, 0.12)
    box(f"{n}_stiff", e, M["blackplastic"], 0, -2.2, 0.42, 8, 2, 0.2)


def enc_pad():
    n = "enc_pad"
    e = item(n)
    box(f"{n}_pad", e, M["rubber"], 0, 0, 0, 10, 10, 1.2, bevel=0.3)


def enc_sticker():
    n = "enc_sticker"
    e = item(n)
    box(f"{n}_foil", e, M["sticker"], 0, 0, 0, 10, 6, 0.05)
    box(f"{n}_text", e, M["recess"], 0, 0, 0.05, 7, 1, 0.01)


# ---------------------------------------------------------------------------
# Retro / through-hole packages and new modules (src/sim/footprints.ts)
# ---------------------------------------------------------------------------


def to220():
    n = "pkg_TO220"
    e = item(n)
    box(f"{n}_body", e, M["black"], 0, 0, 1.5, 10.2, 4.6, 9, bevel=0.2)
    box(f"{n}_tab", e, M["steel"], 0, 1.0, 10.5, 10.2, 1.3, 6.5)
    cyl(f"{n}_hole", e, M["recess"], 0, 1.0, 13.5, 1.8, 0.05, n=20, axis="y")
    for i in range(3):
        box(f"{n}_leg{i}", e, M["tin"], -2.54 + i * 2.54, 0, 0, 0.8, 0.5, 1.6)


def dip_pkg(pins, row):
    n = f"pkg_DIP{pins}"
    e = item(n)
    k = pins // 2
    w = k * 2.54 + 1.2
    h = row - 1.6
    box(f"{n}_body", e, M["black"], 0, 0, 0.6, w, h, 3.2, bevel=0.15)
    cyl(f"{n}_notch", e, M["recess"], -w / 2, 0, 3.8, 0.9, 0.02, n=16)
    cyl(f"{n}_dot", e, M["band"], -w / 2 + 1.6, h / 2 - 1.4, 3.8, 0.4, 0.01, n=12)
    for i in range(k):
        x = -(k - 1) * 2.54 / 2 + i * 2.54
        for sy in (-1, 1):
            box(f"{n}_l{i}{sy}", e, M["tin"], x, sy * (row / 2), 0, 0.5, 0.6, 1.8)


def coin():
    n = "pkg_COIN"
    e = item(n)
    cyl(f"{n}_cell", e, M["steel"], 0, 0, 0.3, 10, 3.2, n=48)
    cyl(f"{n}_top", e, M["tin"], 0, 0, 3.5, 9.3, 0.02, n=48)
    box(f"{n}_tabp", e, M["tin"], 11, 0, 0, 5, 3, 0.3)
    box(f"{n}_tabn", e, M["tin"], -11, 0, 0, 5, 3, 0.3)


def edge6():
    n = "pkg_EDGE6"
    e = item(n)  # gold fingers are drawn by the board art; nothing stands on the board


def cartslot6():
    n = "pkg_CARTSLOT6"
    e = item(n)
    box(f"{n}_body", e, M["blackplastic"], 0, 0, 0, 44, 10, 11, bevel=0.4)
    box(f"{n}_mouth", e, M["recess"], 0, 0, 10.9, 40, 2.4, 0.15)
    for i in range(18):
        box(f"{n}_c{i}", e, M["gold"], -19 + i * 2.25, 0, 10.95, 0.8, 1.6, 0.06)


def rfmod():
    n = "pkg_RFMOD"
    e = item(n)
    box(f"{n}_can", e, M["shieldsteel"], 0, 0, 0, 22, 16, 11, bevel=0.2)
    cyl(f"{n}_jack", e, M["tin"], 0, -8, 5.5, 3, 5, n=24, axis="y", r2=3)
    cyl(f"{n}_pin", e, M["gold"], 0, -10, 5.5, 0.6, 3, n=12, axis="y")


def rca2():
    n = "pkg_RCA2"
    e = item(n)
    box(f"{n}_body", e, M["blackplastic"], 0, 0, 0, 10, 12, 9, bevel=0.3)
    cyl(f"{n}_ring", e, M["gold"], 0, -6, 5, 4, 5, n=28, axis="y")
    cyl(f"{n}_hole", e, M["recess"], 0, -11.05, 5, 1.1, 0.1, n=16, axis="y")


def hdr3():
    n = "pkg_HDR3"
    e = item(n)
    box(f"{n}_body", e, M["blackplastic"], 0, 0, 0, 8.6, 3.2, 8.5, bevel=0.2)
    for i in range(3):
        box(f"{n}_p{i}", e, M["recess"], -2.54 + i * 2.54, 0, 8.45, 1.1, 1.1, 0.1)


def stick():
    n = "pkg_STICK"
    e = item(n)
    box(f"{n}_frame", e, M["steel"], 0, 0, 0, 16, 16, 7, bevel=0.3)
    box(f"{n}_potx", e, M["blackplastic"], 9, 0, 0, 2.4, 9, 6)
    box(f"{n}_poty", e, M["blackplastic"], 0, 9, 0, 9, 2.4, 6)
    cyl(f"{n}_shaft", e, M["blackplastic"], 0, 0, 7, 1.6, 4, n=16)
    cyl(f"{n}_cap", e, M["rubber"], 0, 0, 11, 7.5, 2.5, n=40, r2=6.5)


def spring2():
    n = "pkg_SPRING2"
    e = item(n)
    box(f"{n}_plate", e, M["tin"], -27, 0, 0, 1, 8, 6)
    for k in range(5):
        cyl(f"{n}_coil{k}", e, M["steel"], 27 - k * 0.9, 0, 3, 3 - k * 0.3, 0.5, n=20, axis="x")


def aa2():
    n = "pkg_AA2"
    e = item(n)
    for sy in (-1, 1):
        cyl(f"{n}_cell{sy}", e, M["battwrap"], -25, sy * 7.2, 7, 7, 48, n=32, axis="x")
        cyl(f"{n}_nip{sy}", e, M["steel"], 23, sy * 7.2, 7, 2.2, 1.6, n=16, axis="x")


def screen_s():
    n = "pkg_SCREEN_S"
    e = item(n)
    box(f"{n}_frame", e, M["bezel"], 0, 0, 0, 46, 40, 2.8, bevel=0.6, segments=3)
    box(f"{n}_lens", e, M["lcd"], 0, -2, 2.8, 36, 30, 0.15)
    box(f"{n}_ribbon", e, M["fpc"], 0, 19, 0, 6, 3, 0.2)


def fpc_n(n, w):
    e = item(n)
    box(f"{n}_body", e, M["nylon"], 0, 0, 0, w, 4, 1.2, bevel=0.1)
    box(f"{n}_latch", e, M["blackplastic"], 0, -1.4, 1.2, w, 1.2, 0.3)


def fpc3():
    fpc_n("pkg_FPC3", 9)
    fpc_n("pkg_FPC4", 10)


def slide():
    n = "pkg_SLIDE"
    e = item(n)
    box(f"{n}_body", e, M["steel"], 0, 0, 0, 9, 4, 4, bevel=0.2)
    box(f"{n}_knob", e, M["blackplastic"], -1.2, 0, 4, 2.6, 2.2, 2.4, bevel=0.2)


def pak():
    n = "pkg_PAK"
    e = item(n)
    box(f"{n}_body", e, M["blackplastic"], 0, 0, 0, 24, 10, 30, bevel=0.8)
    box(f"{n}_label", e, M["sticker"], 0, -5.05, 12, 18, 0.1, 14)


def screen_m():
    n = "pkg_SCREEN_M"
    e = item(n)
    box(f"{n}_frame", e, M["bezel"], 0, 0, 0, 52, 34, 2.6, bevel=0.6, segments=3)
    box(f"{n}_lens", e, M["glass"], 0, -1, 2.6, 46, 27, 0.15)
    box(f"{n}_ribbon", e, M["fpc"], 0, 16, 0, 8, 3, 0.2)


screen_m()


def screen_sized(n, w, h):
    e = item(n)
    box(f"{n}_frame", e, M["bezel"], 0, 0, 0, w, h, 2.6, bevel=0.6, segments=3)
    box(f"{n}_lens", e, M["glass"], 0, 0, 2.6, w - 5, h - 5, 0.15)
    box(f"{n}_ribbon", e, M["fpc"], 0, h / 2 - 1, 0, 10, 3, 0.2)


screen_sized("pkg_SCREEN_L", 76, 58)
screen_sized("pkg_SCREEN_W", 118, 70)


def tpad():
    n = "pkg_TPAD"
    e = item(n)
    box(f"{n}_panel", e, M["blackplastic"], 0, 0, 0, 30, 14, 1.6, bevel=0.4)
    box(f"{n}_ribbon", e, M["fpc"], 0, 8, 0, 6, 3, 0.15)


tpad()
slide()
pak()
to220()
for _p, _r in ((40, 15.24), (28, 15.24), (16, 7.62), (14, 7.62)):
    dip_pkg(_p, _r)
coin()
edge6()
cartslot6()
rfmod()
rca2()
hdr3()
stick()
spring2()
aa2()
screen_s()
fpc3()

# Front-shell pieces for handhelds / controllers: assembled at runtime from the device's
# face layout (src/sim/board.ts FaceSpec) so the windows and caps line up with the board.


def face_pieces():
    sh = M["shell"]
    k = M["blackplastic"]
    e = item("enc_slab")  # 10 x 10 x 1, scaled to fill around the screen window
    box("enc_slab_box", e, sh, 0, 0, 0, 10, 10, 1, bevel=0.05)
    e = item("enc_dpad")
    box("enc_dpad_h", e, k, 0, 0, 0, 22, 7.5, 3.2, bevel=0.6)
    box("enc_dpad_v", e, k, 0, 0, 0, 7.5, 22, 3.2, bevel=0.6)
    cyl("enc_dpad_dimple", e, M["rubber"], 0, 0, 3.2, 3, 0.2, n=24)
    e = item("enc_btn")
    cyl("enc_btn_cap", e, k, 0, 0, 0, 4.6, 2.6, n=32)
    cyl("enc_btn_dome", e, k, 0, 0, 2.6, 4.4, 0.7, n=32, r2=3.6)
    e = item("enc_pill")
    box("enc_pill_cap", e, M["rubber"], 0, 0, 0, 9, 3.4, 1.6, bevel=0.8)
    e = item("enc_grille")
    box("enc_grille_plate", e, sh, 0, 0, 0, 22, 14, 0.4)
    for i in range(6):
        for j in range(4):
            cyl(f"enc_grille_h{i}_{j}", e, M["recess"], -8.75 + i * 3.5, -5.25 + j * 3.5, 0.4, 0.7, 0.05, n=12)
    e = item("enc_bezel")  # dark border inside the screen window, 10 x 10, scaled
    box("enc_bezel_box", e, M["bezel"], 0, 0, 0, 10, 10, 0.4)


face_pieces()
enc_shell()
enc_screw()
enc_shield()
enc_heatsink()
enc_fan()
enc_plug()
enc_ribbon()
enc_pad()
enc_sticker()

# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_apply=True,
    export_yup=True,
    export_extras=False,
)
print(f"[bench-tech] exported {len([o for o in scene.objects if o.parent is None])} items to {OUT}")
