# -------------------------------------------------------------
# Module for fill-the-blanks expanded addon
# -------------------------------------------------------------

__version__ = "25.3-3"

try:
    from .binding import run
    run()
except ImportError as ie:
    print(""" [WARNING] Fill the Blanks Expanded ::: It wasn\'t possible to resolve imports. 
        Probably anki was not found, duo to: Running In test mode !!! """)

    print(ie)
