"""
Bench Tech front shells for handhelds and controllers.

Run headless:  blender -b --factory-startup -P tools/blender/build_shells.py -- public/models/shells.glb

Reads tools/blender/faces.json (exported from the TypeScript device definitions by
tools/build-faces.gen.ts) and builds one shell per device, named "face_<device id>":
a rounded outline (body + grips as smooth lobes), screen windows and stick holes cut
through, top edge bevelled. Units are millimetres; origin = board centre, board top at
z = 0 (the shell runs from just below the board up to the face height).
Buttons, D-pads, glow strips and panels are separate parts placed at runtime.
"""

import json
import math
import os
import sys

import bmesh
import bpy

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT = argv[0] if argv else "shells.glb"
HERE = os.path.dirname(os.path.abspath(__file__))
FACES = json.load(open(os.path.join(HERE, "faces.json"), encoding="utf-8"))
BOARD_T = 1.6

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

shell_mat = bpy.data.materials.new("face_shell")
shell_mat.use_nodes = True
bsdf = shell_mat.node_tree.nodes.get("Principled BSDF")
bsdf.inputs["Base Color"].default_value = (0.9, 0.9, 0.9, 1)
bsdf.inputs["Roughness"].default_value = 0.45


def rounded_outline(x0, y0, x1, y1, radii, segs=10):
    """Points of a rounded rectangle in board space (x right, y down), clockwise from top-left."""
    w, h = x1 - x0, y1 - y0
    tl, tr, br, bl = [max(0.01, min(r, w / 2 - 0.01, h / 2 - 0.01)) for r in radii]
    pts = []
    corners = [
        (x0 + tl, y0 + tl, tl, 180, 270),
        (x1 - tr, y0 + tr, tr, 270, 360),
        (x1 - br, y1 - br, br, 0, 90),
        (x0 + bl, y1 - bl, bl, 90, 180),
    ]
    for cx, cy, r, a0, a1 in corners:
        for i in range(segs + 1):
            a = math.radians(a0 + (a1 - a0) * i / segs)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def prism(name, pts, z0, z1, cx, cy):
    """Extrude a board-space outline into a solid between z0 and z1 (Blender: y flipped)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    ring = [bm.verts.new((x - cx, -(y - cy), z0)) for x, y in pts]
    face = bm.faces.new(ring)
    if face.normal.z > 0:
        face.normal_flip()
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    verts = [v for v in ext["geom"] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, z1 - z0), verts=verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    return ob


def boolean(target, tool, op):
    mod = target.modifiers.new("bool", "BOOLEAN")
    mod.operation = op
    mod.solver = "EXACT"
    mod.object = tool
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(tool, do_unlink=True)


def build(dev):
    did = dev["id"]
    W, H = dev["width"], dev["height"]
    f = dev["face"]
    top = f.get("height", 9)
    z0 = -BOARD_T - 0.6
    cx, cy = W / 2, H / 2
    small = min(W, H)
    body_r = f.get("corners") or [min(8, small / 6)] * 4
    tl, tr, br, bl = body_r
    # The shell overhangs the board enough that a big rounded corner still covers the
    # board's square corner: margin >= r * (1 - 1/sqrt 2) on both sides of that corner.
    k = 1 - 1 / math.sqrt(2)
    mL, mR = max(1.6, k * max(tl, bl) + 0.5), max(1.6, k * max(tr, br) + 0.5)
    mT, mB = max(1.6, k * max(tl, tr) + 0.5), max(1.6, k * max(bl, br) + 0.5)
    shell = prism(f"face_{did}_shell", rounded_outline(-mL, -mT, W + mR, H + mB, [r + 1.6 for r in body_r]), z0, top, cx, cy)
    # Grips: rounded lobes merged into the body
    for i, (gx0, gy0, gx1, gy1) in enumerate(f.get("grips", [])):
        r = min(gx1 - gx0, gy1 - gy0) * 0.48
        lobe = prism(f"grip{i}", rounded_outline(gx0, gy0 - 12, gx1, gy1, [6, 6, r, r]), z0, top, cx, cy)
        boolean(shell, lobe, "UNION")
    # Screen windows and stick holes, cut right through
    for i, (wx, wy, ww, wh) in enumerate(f.get("windows", [])):
        cut = prism(f"win{i}", rounded_outline(wx - ww / 2, wy - wh / 2, wx + ww / 2, wy + wh / 2, [2] * 4), z0 - 2, top + 2, cx, cy)
        boolean(shell, cut, "DIFFERENCE")
    for i, (sx, sy) in enumerate(f.get("sticks", [])):
        cut = prism(f"stk{i}", rounded_outline(sx - 7, sy - 7, sx + 7, sy + 7, [7] * 4, segs=16), z0 - 2, top + 2, cx, cy)
        boolean(shell, cut, "DIFFERENCE")
    # Openings in the wall for connectors at the board edge (USB port): a tunnel up to just over the port's height
    for i, (px, py, pw, ph) in enumerate(f.get("ports", [])):
        cut = prism(f"port{i}", rounded_outline(px - pw / 2, py - ph / 2, px + pw / 2, py + ph / 2, [1.3] * 4), z0 - 2, min(top - 0.5, 3.8), cx, cy)
        boolean(shell, cut, "DIFFERENCE")
    # Clamshell opened flat: a groove across where the two halves meet
    if f.get("hinge") is not None:
        hy = f["hinge"]
        groove = prism("hinge", rounded_outline(-4, hy - 1.5, W + 4, hy + 1.5, [1.5] * 4), top - 2.5, top + 2, cx, cy)
        boolean(shell, groove, "DIFFERENCE")
    # Soft top edges
    bev = shell.modifiers.new("bevel", "BEVEL")
    bev.width = min(1.6, top * 0.18)
    bev.segments = 3
    bev.limit_method = "ANGLE"
    bev.angle_limit = math.radians(40)
    bpy.context.view_layer.objects.active = shell
    bpy.ops.object.modifier_apply(modifier=bev.name)
    shell.data.materials.append(shell_mat)
    item = bpy.data.objects.new(f"face_{did}", None)
    scene.collection.objects.link(item)
    shell.parent = item
    print(f"[bench-tech] shell face_{did}: {len(shell.data.polygons)} faces")


for dev in FACES:
    build(dev)

bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_yup=True, export_extras=False)
print(f"[bench-tech] exported {len(FACES)} shells to {OUT}")
