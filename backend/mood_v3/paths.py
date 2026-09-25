"""Location of the frozen V3 data files (workbooks) used by the vendored engines."""
import os
DATA_DIR = os.environ.get('MOOD_V3_DATA_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data'))
DATA_DIR_SLASH = DATA_DIR.rstrip('/') + '/'
