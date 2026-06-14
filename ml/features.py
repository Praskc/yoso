
import numpy as np
from ml.config import PUNTAS



def recalibrar_batch(
    coords: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    
    pts = coords.reshape(-1, 21, 2).astype(np.float32)
    pts = pts - pts[:, 0:1, :]

    norms = np.linalg.norm(pts[:, 9, :], axis=1)                 # (N,)
    # Mismo umbral que src/engine/inference.ts (ver recalibrar()).
    valid = norms > 1e-4
    safe  = np.where(valid, norms, 1.0)
    pts   = pts / safe[:, np.newaxis, np.newaxis]

    angles = np.arctan2(pts[:, 9, 1], pts[:, 9, 0])             # (N,)
    return pts, angles, valid


def construir_features_batch(pts: np.ndarray, angles: np.ndarray) -> np.ndarray:
    coords_flat = pts.reshape(-1, 42)                            # (N, 42)
    dists       = np.linalg.norm(pts[:, PUNTAS, :], axis=2)     # (N, 5)
    return np.concatenate(
        [coords_flat, angles[:, np.newaxis], dists], axis=1
    ).astype(np.float32)



def recalibrar(coords_42: np.ndarray) -> tuple[np.ndarray, float] | None:
    pts = coords_42.reshape(21, 2).astype(np.float32)
    pts -= pts[0]
    dist = np.linalg.norm(pts[9])
    # Mismo umbral que inference.ts (dp <= 1e-4): el dataset no debe tener muestras que la inferencia descarte.
    if dist <= 1e-4:
        return None
    pts /= dist
    return pts.flatten(), float(np.arctan2(pts[9, 1], pts[9, 0]))


def construir_features(coords_42: np.ndarray, angulo: float) -> np.ndarray:
    """(42,), float → (48,)"""
    pts   = coords_42.reshape(21, 2)
    dists = np.linalg.norm(pts[PUNTAS], axis=1).astype(np.float32)
    return np.concatenate([coords_42, [angulo], dists]).astype(np.float32)
