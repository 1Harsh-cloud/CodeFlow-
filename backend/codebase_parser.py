"""
Parse code files to extract structure: folders, files, functions, classes, routes.
Also extracts imports for dependency edges between files/components.
"""
import re
import os
from typing import List, Dict, Any, Tuple


def extract_python_imports(content: str, filepath: str) -> List[str]:
    """Extract imported modules/paths from Python file (relative to project)."""
    imports = []
    dir_path = os.path.dirname(filepath).replace("\\", "/")
    for line in content.split("\n"):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        # from x.y.z import ... or import x.y
        m = re.match(r"^(?:from\s+([\w\.]+)\s+import|import\s+([\w\.]+))", stripped)
        if m:
            mod = (m.group(1) or m.group(2) or "").strip()
            if not mod or mod.startswith("_"):
                continue
            skip = {"flask", "django", "requests", "os", "sys", "json", "re", "math", "random"}
            if mod.split(".")[0].lower() in skip:
                continue
            imports.append(mod.replace(".", "/"))
        # from .x import or from ..x import (relative)
        m = re.match(r"^from\s+(\.+)([\w\.]*)\s+import", stripped)
        if m:
            dots, rest = m.group(1), (m.group(2) or "").strip()
            base = dir_path
            for _ in range(len(dots) - 1):
                base = os.path.dirname(base)
            resolved = os.path.normpath(os.path.join(base, rest.replace(".", "/"))).replace("\\", "/")
            if resolved:
                imports.append(resolved)
    return imports


def extract_js_imports(content: str, filepath: str) -> List[str]:
    """Extract import paths from JS/TS/JSX file."""
    imports = []
    dir_path = os.path.dirname(filepath).replace("\\", "/")
    for line in content.split("\n"):
        stripped = line.strip()
        if not stripped or stripped.startswith("//") or stripped.startswith("*"):
            continue
        # import X from './path' or import { X } from './path' or import './path'
        m = re.search(r"from\s+['\"]([^'\"]+)['\"]", stripped)
        if m:
            imp = m.group(1)
            if imp.startswith(".") and not imp.startswith(".."):
                # Relative import
                base = dir_path or "."
                resolved = os.path.normpath(os.path.join(base, imp)).replace("\\", "/")
                imports.append(resolved)
            elif imp.startswith(".."):
                base = dir_path or "."
                resolved = os.path.normpath(os.path.join(base, imp)).replace("\\", "/")
                imports.append(resolved)
        else:
            m = re.search(r"import\s+['\"]([^'\"]+)['\"]", stripped)
            if m:
                imp = m.group(1)
                if imp.startswith("."):
                    base = dir_path or "."
                    resolved = os.path.normpath(os.path.join(base, imp)).replace("\\", "/")
                    imports.append(resolved)
    return imports


def resolve_import_to_file(imp_path: str, all_paths: List[str]) -> str | None:
    """Resolve import path to actual file path in codebase."""
    imp = imp_path.replace("\\", "/").strip("/")
    if not imp:
        return None
    for p in all_paths:
        np = p.replace("\\", "/")
        base, ext = os.path.splitext(np)
        # Exact: imp matches path without extension
        if base.endswith(imp) or imp in base or base == imp:
            return np
        # imp is "src/Components/PokemonThumbnail", file is "src/Components/PokemonThumbnail.js"
        for e in [".js", ".jsx", ".ts", ".tsx", ".py", ".css", ".scss"]:
            if (imp + e) in np or np == imp + e:
                return np
    # Try dir/index
    for p in all_paths:
        if imp in p or p.endswith(imp + "/index.js") or p.endswith(imp + "/index.jsx"):
            return p.replace("\\", "/")
    return None


def parse_python_file(content: str, filepath: str) -> List[Dict[str, Any]]:
    """Extract functions and classes from Python file."""
    items = []
    lines = content.split("\n")

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        # Skip empty and comments
        if not stripped or stripped.startswith("#"):
            continue
        # Class definition
        m = re.match(r"^class\s+(\w+)\s*[:(]", stripped)
        if m:
            items.append({"type": "class", "name": m.group(1), "line": i})
            continue
        # Function definition (including async)
        m = re.match(r"^(async\s+)?def\s+(\w+)\s*\(", stripped)
        if m:
            items.append({"type": "function", "name": m.group(2), "line": i})
            continue
        # Django/Flask route decorators
        m = re.search(r'@\w+\.route\s*\(\s*["\']([^"\']+)["\']', stripped)
        if m:
            items.append({"type": "route", "name": m.group(1), "line": i})
            continue
        m = re.search(r"path\s*\(\s*[\"\']([^\"\']+)[\"\']", stripped)
        if m:
            items.append({"type": "route", "name": m.group(1), "line": i})
            continue

    return items


def parse_js_file(content: str, filepath: str) -> List[Dict[str, Any]]:
    """Extract functions and exports from JS/TS/JSX file."""
    items = []
    lines = content.split("\n")

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if not stripped or stripped.startswith("//") or stripped.startswith("*"):
            continue
        # function name() or const name = () =>
        m = re.match(r"^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(", stripped)
        if m:
            items.append({"type": "function", "name": m.group(1), "line": i})
            continue
        m = re.match(r"^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(", stripped)
        if m:
            items.append({"type": "function", "name": m.group(1), "line": i})
            continue
        m = re.match(r"^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(", stripped)
        if m:
            items.append({"type": "function", "name": m.group(1), "line": i})
            continue
        # React component: export default function X or function X(
        m = re.search(r"function\s+([A-Z]\w*)\s*\(", stripped)
        if m:
            items.append({"type": "component", "name": m.group(1), "line": i})
            continue

    return items


CODE_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".rb", ".rs"}


def parse_file(content: str, filepath: str) -> List[Dict[str, Any]]:
    """Dispatch to language-specific parser."""
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".py":
        return parse_python_file(content, filepath)
    if ext in {".js", ".jsx", ".ts", ".tsx"}:
        return parse_js_file(content, filepath)
    return []


def extract_imports(content: str, filepath: str) -> List[str]:
    """Extract import paths for a file."""
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".py":
        return extract_python_imports(content, filepath)
    if ext in {".js", ".jsx", ".ts", ".tsx"}:
        return extract_js_imports(content, filepath)
    return []


def build_codebase_map(files: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Build a graph for visualization from a list of {path, content} dicts.
    Returns: { nodes: [...], edges: [...] } for React Flow.
    Node: { id, label, type, parent? }
    Edge: { source, target }
    """
    nodes = []
    edges = []
    node_ids = set()

    def add_node(id_, label, node_type="file", parent=None):
        if id_ in node_ids:
            return
        node_ids.add(id_)
        nodes.append({"id": id_, "label": label, "type": node_type, "parent": parent})

    # Group by folder
    folders = set()
    for f in files:
        path = f.get("path", "")
        parts = path.replace("\\", "/").split("/")
        for i in range(1, len(parts)):
            folder = "/".join(parts[:i])
            folders.add(folder)

    # Add folder nodes (hierarchical) + folder->folder edges
    sorted_folders = sorted(folders)
    for folder in sorted_folders:
        parts = folder.split("/")
        parent_id = "/".join(parts[:-1]) if len(parts) > 1 else None
        add_node(folder, parts[-1], "folder", parent=parent_id)
        if parent_id:
            edges.append({"source": parent_id, "target": folder})

    # Add file nodes and their children (functions, classes, routes)
    for f in files:
        path = f.get("path", "")
        content = f.get("content", "")
        parts = path.replace("\\", "/").split("/")
        folder = "/".join(parts[:-1]) if len(parts) > 1 else None
        filename = parts[-1]

        file_id = f"file:{path}"
        add_node(file_id, filename, "file", parent=folder)
        if folder:
            edges.append({"source": folder, "target": file_id})

        items = parse_file(content, path)
        for item in items:
            item_id = f"{file_id}::{item['name']}"
            add_node(item_id, item["name"], item.get("type", "function"), parent=file_id)
            edges.append({"source": file_id, "target": item_id})

    # Add dependency edges (imports) between files
    all_paths = [f["path"].replace("\\", "/") for f in files]
    path_to_id = {p: f"file:{p}" for p in all_paths}

    for f in files:
        path = f.get("path", "").replace("\\", "/")
        content = f.get("content", "")
        source_id = f"file:{path}"
        for imp in extract_imports(content, path):
            resolved = resolve_import_to_file(imp, all_paths)
            if resolved and resolved in path_to_id:
                target_id = path_to_id[resolved]
                if source_id != target_id and {"source": source_id, "target": target_id} not in edges:
                    edges.append({"source": source_id, "target": target_id, "type": "dependency"})
                    # Also connect components: who uses whom (source file's components → target file's components)
                    source_items = [n["id"] for n in nodes if n["id"].startswith(source_id + "::")]
                    target_items = [n["id"] for n in nodes if n["id"].startswith(target_id + "::")]
                    for si in source_items:
                        for ti in target_items:
                            if {"source": si, "target": ti} not in edges:
                                edges.append({"source": si, "target": ti, "type": "uses"})

    # Ensure every node has at least one edge (fix orphans)
    edge_sources = {e["source"] for e in edges}
    edge_targets = {e["target"] for e in edges}
    all_node_ids = {n["id"] for n in nodes}
    connected = edge_sources | edge_targets
    orphans = all_node_ids - connected

    for node_id in orphans:
        if node_id.startswith("file:") and "::" in node_id:
            # Item (function/class/component): connect to parent file
            parent_file = node_id.split("::")[0]
            if parent_file in all_node_ids:
                edges.append({"source": parent_file, "target": node_id})
        elif node_id.startswith("file:"):
            # File: connect to parent folder
            path = node_id[5:]
            parts = path.replace("\\", "/").split("/")
            if len(parts) > 1:
                parent_folder = "/".join(parts[:-1])
                if parent_folder in all_node_ids:
                    edges.append({"source": parent_folder, "target": node_id})
        else:
            # Folder: connect to parent folder
            parts = node_id.split("/")
            if len(parts) > 1:
                parent_folder = "/".join(parts[:-1])
                if parent_folder in all_node_ids:
                    edges.append({"source": parent_folder, "target": node_id})

    return {"nodes": nodes, "edges": edges, "files": [f["path"] for f in files]}
