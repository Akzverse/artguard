import os
import sys

_backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

_backend_config = os.path.join(_backend_dir, 'config')
if os.path.isdir(_backend_config) and _backend_config not in __path__:
    __path__.append(_backend_config)
